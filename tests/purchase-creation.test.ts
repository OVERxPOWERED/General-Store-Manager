import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/purchases/route';

const prisma = new PrismaClient();

describe('POST /api/purchases - Purchase Creation Transaction Logic', () => {
  let testSupplier: { id: string; name: string };
  let testProduct1: { id: string; name: string; sku: string; stock: number; purchasePrice: number };
  let testProduct2: { id: string; name: string; sku: string; stock: number; purchasePrice: number };

  beforeEach(async () => {
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();

    testSupplier = await prisma.supplier.create({
      data: {
        name: 'Test Supplier',
        email: 'supplier@test.com',
        phone: '1234567890',
        address: '123 Test St',
      },
    });

    testProduct1 = await prisma.product.create({
      data: {
        name: 'Product A',
        sku: 'PROD-A-001',
        barcode: '1234567890123',
        stock: 10,
        purchasePrice: 50.00,
        salePrice: 100.00,
        category: 'Electronics',
        unit: 'PCS',
        minStockLevel: 5,
      },
    });

    testProduct2 = await prisma.product.create({
      data: {
        name: 'Product B',
        sku: 'PROD-B-002',
        barcode: '1234567890124',
        stock: 20,
        purchasePrice: 30.00,
        salePrice: 75.00,
        category: 'Accessories',
        unit: 'PCS',
        minStockLevel: 10,
      },
    });
  });

  afterEach(async () => {
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.$disconnect();
  });

  describe('Successful Purchase Creation', () => {
    it('should create purchase and increment stock correctly', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-001',
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, quantity: 5, unitPrice: 50.00 },
          { productId: testProduct2.id, quantity: 3, unitPrice: 30.00 },
        ],
        notes: 'Test purchase',
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.invoiceNumber).toBe('INV-2024-001');
      expect(responseData.data.supplierId).toBe(testSupplier.id);
      expect(responseData.data.items).toHaveLength(2);

      const updatedProduct1 = await prisma.product.findUnique({ where: { id: testProduct1.id } });
      const updatedProduct2 = await prisma.product.findUnique({ where: { id: testProduct2.id } });

      expect(updatedProduct1?.stock).toBe(15);
      expect(updatedProduct2?.stock).toBe(23);

      const purchase = await prisma.purchase.findUnique({
        where: { id: responseData.data.id },
        include: { items: true },
      });
      expect(purchase).toBeDefined();
      expect(purchase?.items).toHaveLength(2);
      expect(purchase?.totalAmount).toBe(340.00);
    });

    it('should calculate totalAmount as sum of quantity * unitPrice', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-002',
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, quantity: 10, unitPrice: 50.00 },
          { productId: testProduct2.id, quantity: 4, unitPrice: 30.00 },
          { productId: testProduct1.id, quantity: 2, unitPrice: 55.00 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      const expectedTotal = 10 * 50.00 + 4 * 30.00 + 2 * 55.00;
      expect(responseData.data.totalAmount).toBe(expectedTotal);
      expect(responseData.data.totalAmount).toBe(730.00);
    });

    it('should create purchase with single item', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-003',
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, quantity: 1, unitPrice: 50.00 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      expect(responseData.data.items).toHaveLength(1);
      expect(responseData.data.totalAmount).toBe(50.00);

      const updatedProduct = await prisma.product.findUnique({ where: { id: testProduct1.id } });
      expect(updatedProduct?.stock).toBe(11);
    });

    it('should handle decimal quantities and prices correctly', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-004',
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, quantity: 2.5, unitPrice: 50.50 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      expect(responseData.data.totalAmount).toBe(126.25);

      const updatedProduct = await prisma.product.findUnique({ where: { id: testProduct1.id } });
      expect(updatedProduct?.stock).toBe(12.5);
    });
  });

  describe('Transaction Rollback on Invalid ProductId', () => {
    it('should rollback transaction and not create purchase when productId does not exist', async () => {
      const invalidProductId = 'non-existent-product-id';
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-005',
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, quantity: 5, unitPrice: 50.00 },
          { productId: invalidProductId, quantity: 3, unitPrice: 30.00 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Product not found');

      const purchases = await prisma.purchase.findMany();
      expect(purchases).toHaveLength(0);

      const product1 = await prisma.product.findUnique({ where: { id: testProduct1.id } });
      expect(product1?.stock).toBe(10);
    });

    it('should rollback stock increments when one item fails', async () => {
      const invalidProductId = 'non-existent-product-id';
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-006',
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, quantity: 5, unitPrice: 50.00 },
          { productId: testProduct2.id, quantity: 3, unitPrice: 30.00 },
          { productId: invalidProductId, quantity: 2, unitPrice: 25.00 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);

      const product1 = await prisma.product.findUnique({ where: { id: testProduct1.id } });
      const product2 = await prisma.product.findUnique({ where: { id: testProduct2.id } });
      expect(product1?.stock).toBe(10);
      expect(product2?.stock).toBe(20);

      const purchases = await prisma.purchase.findMany();
      expect(purchases).toHaveLength(0);
    });
  });

  describe('Validation Errors for Missing Fields', () => {
    it('should return 400 when supplierId is missing', async () => {
      const purchaseData = {
        invoiceNumber: 'INV-2024-007',
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, quantity: 5, unitPrice: 50.00 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('supplierId');
    });

    it('should return 400 when invoiceNumber is missing', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, quantity: 5, unitPrice: 50.00 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('invoiceNumber');
    });

    it('should return 400 when purchaseDate is missing', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-008',
        items: [
          { productId: testProduct1.id, quantity: 5, unitPrice: 50.00 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('purchaseDate');
    });

    it('should return 400 when items array is missing', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-009',
        purchaseDate: new Date().toISOString(),
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('items');
    });

    it('should return 400 when items array is empty', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-010',
        purchaseDate: new Date().toISOString(),
        items: [],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('at least one item');
    });

    it('should return 400 when item quantity is missing', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-011',
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, unitPrice: 50.00 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('quantity');
    });

    it('should return 400 when item unitPrice is missing', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-012',
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, quantity: 5 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('unitPrice');
    });

    it('should return 400 when item productId is missing', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-013',
        purchaseDate: new Date().toISOString(),
        items: [
          { quantity: 5, unitPrice: 50.00 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('productId');
    });

    it('should return 400 when quantity is zero or negative', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-014',
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, quantity: 0, unitPrice: 50.00 },
        ],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: purchaseData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('quantity must be greater than 0');
    });

    it('should return 400 when unitPrice is negative', async () => {
      const purchaseData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'INV-2024-015',
        purchaseDate: new Date().toISOString(),
        items: [
          { productId: testProduct1.id, quantity: 5