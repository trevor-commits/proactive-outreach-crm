import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
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
  }),

  // ============================================================================
  // Customer Management
  // ============================================================================
  customers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCustomersByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getCustomerById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Normalize email and phone
        const normalizedData = {
          ...input,
          userId: ctx.user.id,
          email: input.email ? db.normalizeEmail(input.email) : undefined,
          phone: input.phone ? db.normalizePhoneNumber(input.phone) : undefined,
        };

        return await db.createCustomer(normalizedData);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        
        // Normalize email and phone if provided
        const normalizedUpdates = {
          ...updates,
          email: updates.email ? db.normalizeEmail(updates.email) : undefined,
          phone: updates.phone ? db.normalizePhoneNumber(updates.phone) : undefined,
        };

        return await db.updateCustomer(id, ctx.user.id, normalizedUpdates);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCustomer(input.id, ctx.user.id);
        return { success: true };
      }),

    findByPhone: protectedProcedure
      .input(z.object({ phone: z.string() }))
      .query(async ({ ctx, input }) => {
        const normalized = db.normalizePhoneNumber(input.phone);
        return await db.findCustomerByPhone(normalized, ctx.user.id);
      }),

    findByEmail: protectedProcedure
      .input(z.object({ email: z.string() }))
      .query(async ({ ctx, input }) => {
        const normalized = db.normalizeEmail(input.email);
        return await db.findCustomerByEmail(normalized, ctx.user.id);
      }),
  }),

  // ============================================================================
  // Interaction Management
  // ============================================================================
  interactions: router({
    getByCustomerId: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getInteractionsByCustomerId(input.customerId, ctx.user.id);
      }),

    getRecent: protectedProcedure
      .input(z.object({ 
        customerId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getRecentInteractionsByCustomerId(
          input.customerId, 
          ctx.user.id, 
          input.limit
        );
      }),

    create: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        type: z.enum(["call", "sms", "email", "calendar_event", "manual_note"]),
        direction: z.enum(["incoming", "outgoing", "bidirectional"]).optional(),
        date: z.date(),
        subject: z.string().optional(),
        content: z.string().optional(),
        source: z.enum(["iphone", "gmail", "google_calendar", "manual"]),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createInteraction({
          ...input,
          userId: ctx.user.id,
        });
      }),
  }),

  // ============================================================================
  // Service Management
  // ============================================================================
  services: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getServicesByUserId(ctx.user.id);
    }),

    getByCustomerId: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getServicesByCustomerId(input.customerId, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        serviceName: z.string().min(1),
        serviceDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createService({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        serviceName: z.string().min(1).optional(),
        serviceDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return await db.updateService(id, ctx.user.id, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteService(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // Outreach Log Management
  // ============================================================================
  outreach: router({
    listAll: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getAllOutreachLogs(ctx.user.id);
      }),

    getByCustomerId: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getOutreachLogsByCustomerId(input.customerId, ctx.user.id);
      }),

    getLast: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getLastOutreachLog(input.customerId, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        contactedDate: z.date(),
        responseReceived: z.boolean().default(false),
        responseType: z.enum(["positive", "negative", "neutral", "no_response"]).optional(),
        notes: z.string().optional(),
        nextContactDate: z.date().optional(),
        nextContactMonth: z.number().min(1).max(12).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createOutreachLog({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        responseReceived: z.boolean().optional(),
        responseType: z.enum(["positive", "negative", "neutral", "no_response"]).optional(),
        notes: z.string().optional(),
        nextContactDate: z.date().optional(),
        nextContactMonth: z.number().min(1).max(12).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return await db.updateOutreachLog(id, ctx.user.id, updates);
      }),
  }),

  // ============================================================================
  // Data Source Management
  // ============================================================================
  dataSources: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDataSourcesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        sourceType: z.enum(["iphone_backup", "gmail", "google_calendar"]),
        status: z.enum(["pending", "in_progress", "completed", "failed"]).default("pending"),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createDataSource({
          ...input,
          userId: ctx.user.id,
        });
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "failed"]),
        errorMessage: z.string().optional(),
        lastSyncDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return await db.updateDataSource(id, ctx.user.id, updates);
      }),
  }),

  // ============================================================================
  // Google Credentials Management
  // ============================================================================
  google: router({
    getCredentials: protectedProcedure.query(async ({ ctx }) => {
      const creds = await db.getGoogleCredentialsByUserId(ctx.user.id);
      if (!creds) return null;
      
      // Don't send tokens to frontend, just connection status
      return {
        connected: true,
        expiresAt: creds.expiresAt,
        scope: creds.scope,
      };
    }),

    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteGoogleCredentials(ctx.user.id);
      return { success: true };
    }),
  }),

  // ============================================================================
  // Recommendation Engine
  // ============================================================================
  recommendations: router({
    get: protectedProcedure
      .input(z.object({
        serviceKeyword: z.string().optional(),
        limit: z.number().default(20),
      }))
      .query(async ({ ctx, input }) => {
        const allCustomers = await db.getCustomersByUserId(ctx.user.id);
        const allServices = await db.getServicesByUserId(ctx.user.id);
        
        // Build customer-service map
        const customerServiceMap = new Map<number, typeof allServices>();
        allServices.forEach(service => {
          const existing = customerServiceMap.get(service.customerId) || [];
          customerServiceMap.set(service.customerId, [...existing, service]);
        });

        // Filter customers who have had the service
        let eligibleCustomers = allCustomers;
        if (input.serviceKeyword) {
          eligibleCustomers = allCustomers.filter(customer => {
            const services = customerServiceMap.get(customer.id) || [];
            return services.some(s => 
              s.serviceName.toLowerCase().includes(input.serviceKeyword!.toLowerCase())
            );
          });
        }

        // Score and filter each customer
        const scoredCustomers = await Promise.all(
          eligibleCustomers.map(async (customer) => {
            // Get last outreach
            const lastOutreach = await db.getLastOutreachLog(customer.id, ctx.user.id);
            
            // Apply 60-day cooldown for no-response contacts
            if (lastOutreach && !lastOutreach.responseReceived) {
              const daysSinceContact = Math.floor(
                (Date.now() - lastOutreach.contactedDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (daysSinceContact < 60) {
                return null; // Skip this customer
              }
            }

            // Calculate score
            let score = 0;
            const services = customerServiceMap.get(customer.id) || [];
            const now = new Date();
            const currentMonth = now.getMonth() + 1;

            // Seasonality scoring - higher score if they had service same month last year
            services.forEach(service => {
              const serviceMonth = service.serviceDate.getMonth() + 1;
              if (serviceMonth === currentMonth) {
                score += 10;
              }
            });

            // Next contact date scoring
            if (lastOutreach?.nextContactDate) {
              const daysUntilNextContact = Math.floor(
                (lastOutreach.nextContactDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              if (daysUntilNextContact <= 7 && daysUntilNextContact >= 0) {
                score += 20; // High priority if next contact is within a week
              }
            }

            // Next contact month scoring
            if (lastOutreach?.nextContactMonth === currentMonth) {
              score += 15;
            }

            // Get last interaction date
            const lastInteractionDate = await db.getLastInteractionDate(customer.id, ctx.user.id);
            const daysSinceInteraction = lastInteractionDate 
              ? Math.floor((Date.now() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24))
              : 999;

            return {
              customer,
              score,
              lastOutreach,
              lastInteractionDate,
              daysSinceInteraction,
              services: services.filter(s => 
                !input.serviceKeyword || 
                s.serviceName.toLowerCase().includes(input.serviceKeyword.toLowerCase())
              ),
            };
          })
        );

        // Filter out nulls and sort by score
        const recommendations = scoredCustomers
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .sort((a, b) => b.score - a.score)
          .slice(0, input.limit);

        return recommendations;
      }),
  }),
});

export type AppRouter = typeof appRouter;
