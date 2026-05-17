export interface ShopSetupItem {
  key: string
  label: string
  configured: boolean
}

const SHOP_ENVIRONMENT: Array<Omit<ShopSetupItem, 'configured'> & { envKey: string }> = [
  {
    key: 'supabase-url',
    envKey: 'SUPABASE_URL',
    label: 'Supabase project URL',
  },
  {
    key: 'supabase-service-role',
    envKey: 'SUPABASE_SERVICE_ROLE_KEY',
    label: 'Supabase service role key',
  },
  {
    key: 'stripe-secret',
    envKey: 'STRIPE_SECRET_KEY',
    label: 'Stripe secret key',
  },
  {
    key: 'stripe-webhook',
    envKey: 'STRIPE_WEBHOOK_SECRET',
    label: 'Stripe webhook secret',
  },
]

export function getShopSetupStatus() {
  const items = SHOP_ENVIRONMENT.map(({ envKey, ...item }) => ({
    ...item,
    configured: Boolean(process.env[envKey]),
  }))

  return {
    ready: items.every((item) => item.configured),
    items,
    missing: items.filter((item) => !item.configured).map((item) => item.label),
  }
}

export function getCheckoutSetupStatus() {
  const requiredItems: ShopSetupItem[] = [
    {
      key: 'supabase-url',
      label: 'Supabase project URL',
      configured: Boolean(process.env.SUPABASE_URL),
    },
    {
      key: 'supabase-service-role',
      label: 'Supabase service role key',
      configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    {
      key: 'stripe-secret',
      label: 'Stripe secret key',
      configured: Boolean(process.env.STRIPE_SECRET_KEY),
    },
    {
      key: 'stripe-webhook',
      label: 'Stripe webhook secret',
      configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    },
    {
      key: 'checkout-enabled',
      label: 'Checkout enabled flag',
      configured: process.env.SHOP_CHECKOUT_ENABLED === 'true',
    },
  ]

  return {
    ready: requiredItems.every((item) => item.configured),
    items: requiredItems,
    missing: requiredItems.filter((item) => !item.configured).map((item) => item.label),
  }
}

export function getWebhookSetupStatus() {
  const requiredItems: ShopSetupItem[] = [
    {
      key: 'supabase-url',
      label: 'Supabase project URL',
      configured: Boolean(process.env.SUPABASE_URL),
    },
    {
      key: 'supabase-service-role',
      label: 'Supabase service role key',
      configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    {
      key: 'stripe-webhook',
      label: 'Stripe webhook secret',
      configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    },
  ]

  return {
    ready: requiredItems.every((item) => item.configured),
    items: requiredItems,
    missing: requiredItems.filter((item) => !item.configured).map((item) => item.label),
  }
}

export function getAdminDataSetupStatus() {
  const requiredItems: ShopSetupItem[] = [
    {
      key: 'supabase-url',
      label: 'Supabase project URL',
      configured: Boolean(process.env.SUPABASE_URL),
    },
    {
      key: 'supabase-service-role',
      label: 'Supabase service role key',
      configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  ]

  return {
    ready: requiredItems.every((item) => item.configured),
    items: requiredItems,
    missing: requiredItems.filter((item) => !item.configured).map((item) => item.label),
  }
}

export function getAdminDashboardSetupStatus() {
  const requiredItems: ShopSetupItem[] = [
    {
      key: 'supabase-url',
      label: 'Supabase project URL',
      configured: Boolean(process.env.SUPABASE_URL),
    },
    {
      key: 'supabase-service-role',
      label: 'Supabase service role key',
      configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    {
      key: 'admin-access-token',
      label: 'Shop admin access token',
      configured: Boolean(process.env.SHOP_ADMIN_ACCESS_TOKEN),
    },
  ]

  return {
    ready: requiredItems.every((item) => item.configured),
    items: requiredItems,
    missing: requiredItems.filter((item) => !item.configured).map((item) => item.label),
  }
}

export function getAdminSetupStatus() {
  const requiredItems: ShopSetupItem[] = [
    {
      key: 'supabase-url',
      label: 'Supabase project URL',
      configured: Boolean(process.env.SUPABASE_URL),
    },
    {
      key: 'supabase-service-role',
      label: 'Supabase service role key',
      configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    {
      key: 'stripe-webhook',
      label: 'Stripe webhook secret',
      configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    },
    {
      key: 'checkout-enabled',
      label: 'Checkout enabled flag',
      configured: process.env.SHOP_CHECKOUT_ENABLED === 'true',
    },
    {
      key: 'admin-access-token',
      label: 'Shop admin access token',
      configured: Boolean(process.env.SHOP_ADMIN_ACCESS_TOKEN),
    },
  ]

  return {
    ready: requiredItems.every((item) => item.configured),
    items: requiredItems,
    missing: requiredItems.filter((item) => !item.configured).map((item) => item.label),
  }
}
