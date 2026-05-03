"use server";

import { revalidateTag } from "next/cache";

const CACHE_PROFILE = "minutes";

export async function revalidateOrders() {
  revalidateTag("work-orders", CACHE_PROFILE);
}

export async function revalidateAdminOrders() {
  revalidateTag("admin-orders", CACHE_PROFILE);
}

export async function revalidateOrder(id: string) {
  revalidateTag(`work-order-${id}`, CACHE_PROFILE);
}

export async function revalidateAll() {
  revalidateTag("work-orders", CACHE_PROFILE);
  revalidateTag("admin-orders", CACHE_PROFILE);
}
