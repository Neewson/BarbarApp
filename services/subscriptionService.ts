import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

export const STRIPE_PLANS = {
  barber: {
    price_id: 'price_1Tj96zJ8RS3PAniVM2neOwic',
    product_id: 'prod_UiaHtqWoH3Rf9A',
    name: 'Plano Barbeiro',
    price: 49.90,
    interval: 'mês',
  },
} as const;

export interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

async function invokeWithErrorHandling<T>(
  name: string,
  options?: object
): Promise<{ data: T | null; error: string | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke<T>(name, options);
  if (error) {
    let errorMessage = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const statusCode = error.context?.status ?? 500;
        const textContent = await error.context?.text();
        errorMessage = `[${statusCode}] ${textContent || error.message}`;
      } catch {
        errorMessage = error.message || 'Erro desconhecido';
      }
    }
    return { data: null, error: errorMessage };
  }
  return { data, error: null };
}

export async function checkSubscription(): Promise<SubscriptionStatus> {
  const { data, error } = await invokeWithErrorHandling<SubscriptionStatus>('check-subscription');
  if (error || !data) {
    return { subscribed: false, product_id: null, subscription_end: null };
  }
  return data;
}

export async function createCheckoutSession(price_id: string): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await invokeWithErrorHandling<{ url: string }>('create-checkout', {
    body: { price_id },
  });
  if (error || !data?.url) return { url: null, error: error ?? 'URL de checkout não retornada' };
  return { url: data.url, error: null };
}

export async function createCustomerPortalSession(): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await invokeWithErrorHandling<{ url: string }>('customer-portal');
  if (error || !data?.url) return { url: null, error: error ?? 'URL do portal não retornada' };
  return { url: data.url, error: null };
}
