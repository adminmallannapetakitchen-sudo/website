import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Kitchen Settings (singleton) ───────────────────────────────
  await prisma.kitchenSettings.upsert({
    where: { id: 'settings' },
    create: {
      id: 'settings',
      name: 'Mallannapeta Kitchen',
      nameTe: 'మల్లన్నపేట కిచెన్',
      isOpen: true,
      openingHours: '10:00 AM – 9:00 PM',
      openingHoursTe: 'ఉ. 10:00 – రా. 9:00',
      contactPhone: '+91 79930 40100',
      supportWhatsapp: '+91 79930 40100',
      contactEmail: 'mallanapetkitchen@gmail.com',
      instagramUrl: 'https://instagram.com/Mallanapeta_kitchen',
      minOrderValue: 100,
      deliveryFee: 40,
      estimatedPrepMinutes: 45,
    },
    update: {},
  });
  console.log('✅ Kitchen settings');

  // ─── Serviceable Pincode (Jagtial) ────────────────────────────
  await prisma.serviceablePincode.upsert({
    where: { pincode: '505327' },
    create: { pincode: '505327', areaName: 'Jagtial Town', isActive: true },
    update: {},
  });
  console.log('✅ Serviceable pincodes');

  // ─── Categories ─────────────────────────────────────────────
  const categoriesData = [
    { name: 'Chicken', nameTe: 'చికెన్', slug: 'chicken', icon: '🍗', displayOrder: 1 },
    { name: 'Mutton', nameTe: 'మటన్', slug: 'mutton', icon: '🥩', displayOrder: 2 },
    { name: 'Thali Combos', nameTe: 'థాలీ కాంబోలు', slug: 'thali', icon: '🍱', displayOrder: 3 },
    { name: 'Specials', nameTe: 'స్పెషల్స్', slug: 'specials', icon: '⭐', displayOrder: 4 },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: c,
    });
    categories[c.slug] = cat.id;
  }
  console.log(`✅ ${categoriesData.length} categories`);

  // ─── Menu Items + Variants ──────────────────────────────────
  const menuItems = [
    {
      categoryId: categories['chicken'],
      name: 'Chicken & Rice',
      nameTe: 'చికెన్ & రైస్',
      slug: 'chicken-rice',
      description: 'Tender chicken curry with steamed rice — authentic Telangana village style.',
      descriptionTe: 'మెత్తటి చికెన్ కూర మరియు వేయించిన అన్నం — అసలైన తెలంగాణ గ్రామ శైలిలో.',
      imageUrl: '/images/chicken-rice.jpg',
      isBestseller: true,
      variants: [
        { label: '1 Person', labelTe: '1 వ్యక్తి', price: 199, displayOrder: 1 },
        { label: '2 Persons', labelTe: '2 వ్యక్తులు', price: 349, displayOrder: 2 },
        { label: '4 Persons', labelTe: '4 వ్యక్తులు', price: 699, displayOrder: 3 },
      ],
    },
    {
      categoryId: categories['mutton'],
      name: 'Mutton & Rice',
      nameTe: 'మటన్ & రైస్',
      slug: 'mutton-rice',
      description: 'Slow-cooked mutton curry with fragrant rice — a Mallannapeta classic.',
      descriptionTe: 'నిదానంగా వండిన మటన్ కూర మరియు సుగంధ అన్నం — మల్లన్నపేట క్లాసిక్.',
      imageUrl: '/images/mutton-rice.jpg',
      isBestseller: true,
      variants: [
        { label: '1 Person', labelTe: '1 వ్యక్తి', price: 299, displayOrder: 1 },
        { label: '2 Persons', labelTe: '2 వ్యక్తులు', price: 549, displayOrder: 2 },
        { label: '4 Persons', labelTe: '4 వ్యక్తులు', price: 1099, displayOrder: 3 },
      ],
    },
    {
      categoryId: categories['thali'],
      name: 'Thali Combo',
      nameTe: 'థాలీ కాంబో',
      slug: 'thali-combo',
      description: 'Rice + Special Curry + Pappu + Charu + Curd + Appadam + Chutney — complete meal.',
      descriptionTe: 'అన్నం + స్పెషల్ కూర + పప్పు + చారు + పెరుగు + అప్పడం + చట్నీ — పూర్తి భోజనం.',
      imageUrl: '/images/thali.jpg',
      variants: [
        { label: '1 Person', labelTe: '1 వ్యక్తి', price: 199, displayOrder: 1 },
        { label: '2 Persons', labelTe: '2 వ్యక్తులు', price: 349, displayOrder: 2 },
        { label: '4 Persons', labelTe: '4 వ్యక్తులు', price: 699, displayOrder: 3 },
      ],
    },
    {
      categoryId: categories['specials'],
      name: 'Boti',
      nameTe: 'బోటి',
      slug: 'boti',
      description: 'Tender goat intestine slow-cooked in rich Telangana masala — a village delicacy for true foodies.',
      descriptionTe: 'మసాలాలో వండిన మేక ప్రేవులు — నిజమైన ఆహార ప్రేమికుల కోసం.',
      imageUrl: '/images/boti.jpg',
      isSundaySpecialCandidate: true,
      variants: [{ label: '1 KG', labelTe: '1 కేజీ', price: 749, displayOrder: 1 }],
    },
    {
      categoryId: categories['specials'],
      name: 'Thalakaya',
      nameTe: 'తలకాయ',
      slug: 'thalakaya',
      description: 'Goat head curry — a traditional weekend delicacy, rich in flavor and heritage.',
      descriptionTe: 'మేక తల కూర — సంప్రదాయ వారాంత రుచి, రుచి మరియు వారసత్వంతో సమృద్ధి.',
      imageUrl: '/images/thalakaya.jpg',
      isSundaySpecialCandidate: true,
      variants: [{ label: '1 KG', labelTe: '1 కేజీ', price: 1100, displayOrder: 1 }],
    },
  ];

  for (const item of menuItems) {
    const existing = await prisma.menuItem.findUnique({ where: { slug: item.slug } });
    if (existing) {
      console.log(`  ↻ ${item.name} already exists, skipping`);
      continue;
    }
    await prisma.menuItem.create({
      data: {
        categoryId: item.categoryId,
        name: item.name,
        nameTe: item.nameTe,
        slug: item.slug,
        description: item.description,
        descriptionTe: item.descriptionTe,
        imageUrl: item.imageUrl,
        isBestseller: item.isBestseller ?? false,
        isSundaySpecialCandidate: item.isSundaySpecialCandidate ?? false,
        variants: { create: item.variants },
      },
    });
  }
  console.log(`✅ ${menuItems.length} menu items`);

  // ─── OWNER admin user ─────────────────────────────────────
  const ownerEmail = 'mallanapetkitchen@gmail.com';
  const existingOwner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!existingOwner) {
    await prisma.user.create({
      data: {
        email: ownerEmail,
        hashedPassword: await argon2.hash('changeMe123!', { type: argon2.argon2id }),
        name: 'Mallannapeta Kitchen Owner',
        role: Role.OWNER,
        emailVerifiedAt: new Date(),
        notificationPreference: { create: {} },
      },
    });
    console.log(`✅ Owner user created: ${ownerEmail} / changeMe123!  (CHANGE IMMEDIATELY)`);
  } else {
    console.log(`✅ Owner user already exists`);
  }

  // ─── Sample Coupons ──────────────────────────────────────
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.coupon.upsert({
    where: { code: 'FIRST50' },
    create: {
      code: 'FIRST50',
      description: '₹50 off on your first order',
      type: 'FLAT',
      value: 50,
      minOrderValue: 200,
      perUserLimit: 1,
      validFrom: now,
      validTo: nextMonth,
      isActive: true,
    },
    update: {},
  });

  await prisma.coupon.upsert({
    where: { code: 'WELCOME100' },
    create: {
      code: 'WELCOME100',
      description: '₹100 off on orders above ₹500',
      type: 'FLAT',
      value: 100,
      minOrderValue: 500,
      perUserLimit: 1,
      validFrom: now,
      validTo: nextMonth,
      isActive: true,
    },
    update: {},
  });
  console.log('✅ 2 starter coupons (FIRST50, WELCOME100)');

  console.log('\n🎉 Seed complete!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
