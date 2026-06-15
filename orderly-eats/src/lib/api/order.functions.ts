import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  advanceOrder,
  createOrder,
  getOrder,
  getOrders as getOrdersFromStore,
} from "./store.server";

export const placeOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      items: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          qty: z.number().min(1),
          price: z.number().min(0),
        }),
      ),
      total: z.number().min(0),
      payMethod: z.enum(["card", "wallet", "cash"]),
      customer: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        address: z.object({
          street: z.string().min(1),
          apt: z.string().optional(),
          city: z.string().min(1),
          zip: z.string().min(1),
        }),
        notes: z.string().optional(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    return await createOrder(data);
  });

export const getOrderById = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const order = await getOrder(data.id);
    if (!order) throw new Error("Order not found");
    return order;
  });

export const getOrders = createServerFn({ method: "POST" }).handler(async () => {
  return await getOrdersFromStore();
});

export const advanceOrderStatus = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const order = await advanceOrder(data.id);
    if (!order) throw new Error("Order not found");
    return order;
  });
