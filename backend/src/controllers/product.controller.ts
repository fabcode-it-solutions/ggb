import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { sendSuccess } from "../utils/response.util";

export const productController = {
  async createProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const createdBy = req.user!.id;
      const product = await productService.createProduct(req.body, createdBy);
      sendSuccess(res, product, "Product created successfully", 201);
    } catch (error) {
      next(error);
    }
  },

  async getAllProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page, limit, inventoryType, productType, search } = req.query;
      const result = await productService.getAllProducts({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        inventoryType: inventoryType as any,
        productType: productType as any,
        search: search as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getProductionPlanning(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page, limit, inventoryType, search } = req.query;
      const result = await productService.getProductionPlanning({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        inventoryType: inventoryType as "SNOW" | "SXS" | "all" | undefined,
        search: search as string | undefined,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getProductById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  },

  async getProductBySku(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sku } = req.params;
      const product = await productService.getProductBySku(sku);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  },

  async updateProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updatedBy = req.user!.id;
      const product = await productService.updateProduct(
        id,
        req.body,
        updatedBy
      );
      sendSuccess(res, product, "Product updated successfully");
    } catch (error) {
      next(error);
    }
  },

  async bulkUpdateProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const updatedBy = req.user!.id;
      const result = await productService.bulkUpdateProducts(
        req.body.updates,
        updatedBy
      );
      sendSuccess(res, result, "Products updated successfully");
    } catch (error) {
      next(error);
    }
  },

  async deleteProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = req.user!.id;
      const result = await productService.deleteProduct(id, deletedBy);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getInventorySummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const summary = await productService.getInventorySummary();
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  },
};
