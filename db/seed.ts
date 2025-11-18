import { PrismaClient } from '@prisma/client';
import sampleData from './sample-data';
import { hash } from '@/lib/encrypt';

async function main() {
  const prisma = new PrismaClient();
  const p: any = prisma;
  await prisma.product.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.product.createMany({ data: sampleData.products });
  // create colors and sizes
  if (sampleData.colors && sampleData.colors.length) {
    try {
      await p.color.deleteMany();
    } catch (e) {}
    for (const c of sampleData.colors) {
      await p.color.create({ data: c });
    }
  }
  if (sampleData.sizes && sampleData.sizes.length) {
    try {
      await p.size.deleteMany();
    } catch (e) {}
    for (const s of sampleData.sizes) {
      await p.size.create({ data: s });
    }
  }

  // create product variants from sampleData.variants (resolve product and color/size ids)
  if (sampleData.variants && sampleData.variants.length) {
    for (const v of sampleData.variants) {
      const product = await prisma.product.findUnique({ where: { slug: v.productSlug } });
      if (!product) continue;
      const color = v.color ? await p.color.findUnique({ where: { slug: v.color } }) : null;
      const size = v.size ? await p.size.findUnique({ where: { slug: v.size } }) : null;
      await p.productVariant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          colorId: color?.id,
          sizeId: size?.id,
          images: product.images || [],
        },
      });
    }
  }
  const users = [];
  for (let i = 0; i < sampleData.users.length; i++) {
    users.push({
      ...sampleData.users[i],
      password: await hash(sampleData.users[i].password),
    });
    console.log(
      sampleData.users[i].password,
      await hash(sampleData.users[i].password)
    );
  }
  await prisma.user.createMany({ data: users });

  console.log('Database seeded successfully!');
}

main();
