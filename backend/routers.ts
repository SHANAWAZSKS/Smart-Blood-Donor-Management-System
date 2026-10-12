import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getUserByOpenId, updateUserProfile, upsertUser } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in backend/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(1, "Name is required"),
          email: z.string().trim().email("Valid email is required"),
          role: z.enum(["user", "admin"]).default("user"),
          mobileNumber: z.string().optional(),
          bloodGroup: z.string().optional(),
          livingCity: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const openId = `usr_${input.email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        const existingUser = await getUserByOpenId(openId);
        
        // Preserve existing full name if input name is just an email prefix fallback
        const isEmailFallback = input.name.toLowerCase() === input.email.split("@")[0].toLowerCase() || input.name === "Blood Donor";
        const finalName = (existingUser?.name && isEmailFallback) ? existingUser.name : input.name;

        await upsertUser({
          openId,
          name: finalName,
          email: input.email,
          role: existingUser?.role ?? input.role,
          mobileNumber: input.mobileNumber ?? existingUser?.mobileNumber ?? "+91 98765 43210",
          bloodGroup: input.bloodGroup ?? existingUser?.bloodGroup ?? "O+",
          livingCity: input.livingCity ?? existingUser?.livingCity ?? "Hyderabad",
          loginMethod: "email",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(openId, {
          name: finalName,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        const user = await getUserByOpenId(openId);
        return {
          success: true,
          sessionToken,
          user: user ?? { openId, name: finalName, email: input.email, role: input.role },
        };
      }),
  }),

  profile: router({
    update: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(120),
        mobileNumber: z.string().trim().regex(/^\+?[0-9 ()-]{8,20}$/),
        bloodGroup: z.enum(["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"]),
        livingCity: z.string().trim().min(2).max(120),
      }))
      .mutation(async ({ ctx, input }) => {
        const updated = await updateUserProfile(ctx.user.openId, input);
        return updated ?? { ...ctx.user, ...input };
      }),
  }),

  hospital: router({
    broadcast: protectedProcedure
      .input(z.object({
        bloodGroup: z.string().min(2),
        units: z.number().int().min(1).max(20),
        hospital: z.string().min(2),
        note: z.string().max(500).optional(),
        radiusKm: z.number().min(1).max(50).default(10),
        pushEnabled: z.boolean().default(false),
      }))
      .mutation(({ input }) => ({
        requestId: `REQ-${Date.now().toString().slice(-4)}`,
        status: "broadcast",
        matchedDonors: input.pushEnabled ? 12 : 8,
        pushQueued: input.pushEnabled,
        radiusKm: input.radiusKm,
      })),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
