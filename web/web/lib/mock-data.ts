// ── Employer dashboard ────────────────────────────────────────────────────

export const mockAnalytics = {
  spend: {
    total: 47200,
    by_category: [
      { category: 'Wellness',     amount: 12400 },
      { category: 'Learning',     amount: 9800 },
      { category: 'Food',         amount: 8900 },
      { category: 'Lifestyle',    amount: 6200 },
      { category: 'Travel',       amount: 5300 },
      { category: 'Connectivity', amount: 4600 },
    ],
    recent_activity: [
      { id: 1, description: 'Maria Silva redeemed Monthly Gym Membership', timestamp: '2 min ago' },
      { id: 2, description: 'Credits allocated to Engineering team (×12)', timestamp: '1 hr ago' },
      { id: 3, description: "James Carter's Yoga Studio request approved", timestamp: '3 hr ago' },
      { id: 4, description: 'Sophie Müller redeemed Coursera Premium', timestamp: '5 hr ago' },
      { id: 5, description: 'New Hire Pack assigned to Aisha Patel', timestamp: 'Yesterday' },
      { id: 6, description: 'Remote Worker Pack assigned to Design team', timestamp: 'Yesterday' },
    ],
  },
  utilization: { rate: 73 },
  topPerks: [
    { name: 'Monthly Gym Membership', count: 22 },
    { name: 'Coursera Premium', count: 18 },
    { name: 'Weekly Meal Kit', count: 15 },
    { name: 'Headspace Annual', count: 12 },
    { name: 'Home Office Bundle', count: 9 },
  ],
};

export const mockEmployees = [
  { id: 1, full_name: 'Maria Silva',    email: 'maria@acmecorp.com',   team: 'Engineering', wallet_balance: 320, last_redemption: '2 days ago', status: 'active' },
  { id: 2, full_name: 'James Carter',   email: 'james@acmecorp.com',   team: 'Marketing',   wallet_balance: 80,  last_redemption: 'Today',       status: 'active' },
  { id: 3, full_name: 'Sophie Müller',  email: 'sophie@acmecorp.com',  team: 'Design',      wallet_balance: 450, last_redemption: '1 week ago',  status: 'active' },
  { id: 4, full_name: 'Aisha Patel',    email: 'aisha@acmecorp.com',   team: 'Engineering', wallet_balance: 500, last_redemption: null,          status: 'active' },
  { id: 5, full_name: 'Lucas Brennan',  email: 'lucas@acmecorp.com',   team: 'Operations',  wallet_balance: 175, last_redemption: '3 days ago',  status: 'active' },
  { id: 6, full_name: 'Priya Nair',     email: 'priya@acmecorp.com',   team: 'Engineering', wallet_balance: 240, last_redemption: 'Yesterday',   status: 'active' },
  { id: 7, full_name: 'Tom Eriksson',   email: 'tom@acmecorp.com',     team: 'Design',      wallet_balance: 0,   last_redemption: '2 weeks ago', status: 'inactive' },
  { id: 8, full_name: 'Chen Wei',       email: 'chen@acmecorp.com',    team: 'Marketing',   wallet_balance: 380, last_redemption: 'Today',       status: 'active' },
  { id: 9, full_name: 'Fatima Al-Amin', email: 'fatima@acmecorp.com',  team: 'Operations',  wallet_balance: 120, last_redemption: '4 days ago',  status: 'active' },
];

export const mockTeams = [
  { id: 1, name: 'Engineering',  manager: 'Maria Silva',   member_count: 12 },
  { id: 2, name: 'Design',       manager: 'Sophie Müller', member_count: 6  },
  { id: 3, name: 'Marketing',    manager: 'James Carter',  member_count: 8  },
  { id: 4, name: 'Operations',   manager: 'Lucas Brennan', member_count: 10 },
  { id: 5, name: 'Product',      manager: 'Aisha Patel',   member_count: 5  },
];

export const mockPerkRequests = [
  { id: 1, employee_name: 'Lucas Brennan',  perk_name: 'Headspace Annual',        estimated_credits: 80,  reason: 'Managing stress from Q4 crunch',    status: 'pending'  },
  { id: 2, employee_name: 'Chen Wei',        perk_name: 'Coursera Data Science',   estimated_credits: 120, reason: 'Upskilling for ML project',         status: 'pending'  },
  { id: 3, employee_name: 'Fatima Al-Amin',  perk_name: 'Ergonomic Chair Credit',  estimated_credits: 200, reason: 'Home office improvement',           status: 'pending'  },
  { id: 4, employee_name: 'Tom Eriksson',    perk_name: 'Adobe Creative Cloud',    estimated_credits: 150, reason: 'Design tool subscription',          status: 'approved' },
  { id: 5, employee_name: 'Priya Nair',      perk_name: 'Monthly Gym Membership',  estimated_credits: 90,  reason: 'Wellness routine',                  status: 'approved' },
  { id: 6, employee_name: 'James Carter',    perk_name: 'Spotify Premium',         estimated_credits: 20,  reason: 'Focus music during deep work',      status: 'rejected' },
];

export const mockBundles = [
  {
    id: 1,
    name: 'Remote Worker Pack',
    perks: [
      { id: 1, name: 'Home Broadband Credit', credit_price: 80,  category: 'connectivity', is_active: true },
      { id: 2, name: 'Ergonomic Setup Credit', credit_price: 120, category: 'lifestyle',    is_active: true },
      { id: 3, name: 'Headspace Annual',        credit_price: 80,  category: 'wellness',     is_active: true },
    ],
  },
  {
    id: 2,
    name: 'New Hire Pack',
    perks: [
      { id: 4, name: 'Welcome Meal Kit',        credit_price: 60,  category: 'food',         is_active: true },
      { id: 5, name: 'Coursera Starter',         credit_price: 90,  category: 'learning',     is_active: true },
      { id: 6, name: 'Monthly Gym Membership',   credit_price: 90,  category: 'wellness',     is_active: true },
    ],
  },
  {
    id: 3,
    name: 'Performance Reward Pack',
    perks: [
      { id: 7, name: 'City Break Credit',        credit_price: 200, category: 'travel',       is_active: true },
      { id: 8, name: 'Fine Dining Voucher',       credit_price: 100, category: 'food',         is_active: true },
      { id: 9, name: 'Spa Day Credit',            credit_price: 120, category: 'wellness',     is_active: true },
    ],
  },
];

export const mockLifeEvents = [
  {
    id: 1,
    employee_name: 'Maria Silva',
    event_type: 'new_baby',
    status: 'pending_approval',
    suggested_perks: [
      { name: 'Weekly Meal Kit',     credits: 120 },
      { name: 'Childcare App Pro',   credits: 80  },
      { name: 'Sleep Coach',         credits: 50  },
      { name: 'Home Cleaner Credit', credits: 90  },
    ],
  },
  {
    id: 2,
    employee_name: 'Tom Eriksson',
    event_type: 'burnout_leave',
    status: 'pending_approval',
    suggested_perks: [
      { name: 'Headspace Annual',    credits: 80  },
      { name: 'Therapy Session',     credits: 120 },
      { name: 'Nature Retreat',      credits: 200 },
    ],
  },
  {
    id: 3,
    employee_name: 'Fatima Al-Amin',
    event_type: 'relocation',
    status: 'approved',
    suggested_perks: [
      { name: 'Moving Service Credit', credits: 300 },
      { name: 'Local Transport Pass',  credits: 80  },
    ],
  },
];

export const mockSettings = {
  monthly_budget_per_employee: 500,
  credits_rollover: true,
};

// ── Provider ───────────────────────────────────────────────────────────────

export const mockProviderStats = {
  redemptions_this_month: 127,
  credits_earned: 14850,
  is_verified: true,
  redemptions_over_time: Array.from({ length: 30 }, (_, i) => ({
    date: `Jun ${i + 1}`,
    count: Math.round(2 + Math.random() * 8 + (i > 15 ? i * 0.4 : 0)),
  })),
  per_perk: [
    { perk_name: 'Monthly Gym Membership',  redemptions: 48, credits: 4320 },
    { perk_name: 'Yoga Studio Pass',        redemptions: 31, credits: 2480 },
    { perk_name: 'Personal Training (×4)',  redemptions: 22, credits: 3520 },
    { perk_name: 'Nutrition Consultation',  redemptions: 15, credits: 2250 },
    { perk_name: 'Sauna & Recovery Pass',   redemptions: 11, credits: 2280 },
  ],
  peak_times: [
    { hour: '6am',  count: 8  },
    { hour: '7am',  count: 22 },
    { hour: '8am',  count: 18 },
    { hour: '12pm', count: 31 },
    { hour: '1pm',  count: 27 },
    { hour: '5pm',  count: 38 },
    { hour: '6pm',  count: 44 },
    { hour: '7pm',  count: 29 },
    { hour: '8pm',  count: 14 },
  ],
};

export const mockMyPerks = [
  { id: 1, name: 'Monthly Gym Membership',  category: 'wellness',  credit_price: 90,  description: 'Full access to all gym facilities including classes.', is_active: true,  images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=70'] },
  { id: 2, name: 'Yoga Studio Pass',         category: 'wellness',  credit_price: 80,  description: 'Unlimited classes at our city-centre yoga studio.',     is_active: true,  images: ['https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&q=70'] },
  { id: 3, name: 'Personal Training (×4)',   category: 'wellness',  credit_price: 160, description: 'Four 1-hour sessions with a certified personal trainer.', is_active: true, images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=70'] },
  { id: 4, name: 'Nutrition Consultation',   category: 'wellness',  credit_price: 150, description: 'One-on-one session with a registered nutritionist.',      is_active: true,  images: ['https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=70'] },
  { id: 5, name: 'Sauna & Recovery Pass',    category: 'wellness',  credit_price: 60,  description: 'Monthly access to sauna, steam room, and ice bath.',     is_active: false, images: ['https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400&q=70'] },
  { id: 6, name: 'Online PT Subscription',   category: 'wellness',  credit_price: 50,  description: 'Digital workout plans updated weekly.',                   is_active: true,  images: ['https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=400&q=70'] },
];
