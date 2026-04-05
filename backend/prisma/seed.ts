import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password.js';

const prisma = new PrismaClient();

async function main() {
  const DEV_IDS = {
    client: '11111111-1111-1111-1111-111111111101',
    admin: '11111111-1111-1111-1111-111111111102',
    driver: '11111111-1111-1111-1111-111111111103',
  } as const;

  await prisma.submaterial.deleteMany();
  await prisma.material.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();

  const client = await prisma.user.create({
    data: {
      id: DEV_IDS.client,
      yandexId: 'dev-client-1',
      role: 'CLIENT',
      name: 'Тестовый Клиент',
      phone: '+79990000001',
      email: 'client@example.com',
      login: 'client',
      passwordHash: await hashPassword('client'),
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: DEV_IDS.admin,
      yandexId: 'dev-admin-1',
      role: 'ADMIN',
      name: 'Администратор',
      phone: '+79990000002',
      email: 'admin@example.com',
      login: 'admin',
      passwordHash: await hashPassword('admin'),
    },
  });

  const driver = await prisma.user.create({
    data: {
      id: DEV_IDS.driver,
      yandexId: 'dev-driver-1',
      role: 'DRIVER',
      name: 'Водитель',
      phone: '+79990000003',
      email: 'driver@example.com',
      carBrand: 'Toyota',
      carPlateNumber: 'A123BC',
      login: 'driver',
      passwordHash: await hashPassword('driver'),
    },
  });

  const sand = await prisma.material.create({
    data: {
      name: 'Песок',
      slug: 'sand',
      imageKey: 'sand',
      unit: 'm3',
      isActive: true,
      sortOrder: 10,
      submaterials: {
        create: [
          { name: 'Песок карьерный', basePricePerUnit: 900, markupPercent: 0, pricePerUnit: 900, sortOrder: 1 },
          { name: 'ПГС (до 45% гравия)', basePricePerUnit: 1600, markupPercent: 0, pricePerUnit: 1600, sortOrder: 2 },
          { name: 'Песок сеяный', basePricePerUnit: 1100, markupPercent: 0, pricePerUnit: 1100, sortOrder: 3 },
          { name: 'Песок мытый', basePricePerUnit: 1600, markupPercent: 0, pricePerUnit: 1600, sortOrder: 4 },
        ],
      },
    },
  });

  const gravel = await prisma.material.create({
    data: {
      name: 'Щебень',
      slug: 'gravel',
      imageKey: 'gravel',
      unit: 'm3',
      isActive: true,
      sortOrder: 20,
      submaterials: {
        create: [
          { name: 'Щебень вторичный', basePricePerUnit: 2100, markupPercent: 0, pricePerUnit: 2100, sortOrder: 1 },
          { name: 'Щебень гравийный', basePricePerUnit: 3600, markupPercent: 0, pricePerUnit: 3600, sortOrder: 2 },
          { name: 'Щебень известняковый', basePricePerUnit: 2900, markupPercent: 0, pricePerUnit: 2900, sortOrder: 3 },
          { name: 'Щебень гранитный', basePricePerUnit: 4700, markupPercent: 0, pricePerUnit: 4700, sortOrder: 4 },
        ],
      },
    },
  });

  await prisma.material.create({
    data: {
      name: 'Асфальт',
      slug: 'asphalt',
      imageKey: 'asphalt',
      unit: 'm3',
      isActive: true,
      sortOrder: 30,
      submaterials: {
        create: [{ name: 'Асфальтовая крошка', basePricePerUnit: 2200, markupPercent: 0, pricePerUnit: 2200, sortOrder: 1 }],
      },
    },
  });

  console.log('Seed OK. Dev users:', { client: client.id, admin: admin.id, driver: driver.id });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
