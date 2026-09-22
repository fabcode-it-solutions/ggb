"use client";
// components/orders/OrderForm.tsx

import { useState, useCallback } from "react";
import { Plus, X, Minus } from "lucide-react";
import type { CreateOrderPayload, OrderLineItem } from "@/services/order.service";
import type { ShippingAddress } from "@/services/order.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormErrors {
  orderNo?: string;
  lineItems?: string;
  customerName?: string;
  customerEmail?: string;
  "shippingAddress.address1"?: string;
  "shippingAddress.city"?: string;
  "shippingAddress.province"?: string;
  "shippingAddress.zip"?: string;
  "shippingAddress.country"?: string;
  general?: string;
  [key: string]: string | undefined;
}

interface OrderFormProps {
  onSubmit: (data: CreateOrderPayload) => Promise<void>;
  isSubmitting: boolean;
  submitLabel?: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_ADDRESS: ShippingAddress = {
  address1: "",
  address2: "",
  city: "",
  province: "",
  zip: "",
  country: "",
};

const DEFAULT_LINE_ITEM: OrderLineItem = { sku: "", quantity: 1, price: "" };

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(
  orderNo: string,
  lineItems: OrderLineItem[],
  customerName: string,
  customerEmail: string,
  shippingAddress: ShippingAddress,
): FormErrors {
  const errs: FormErrors = {};

  if (!orderNo.trim()) errs.orderNo = "Order number is required";
  if (lineItems.length === 0) {
    errs.lineItems = "At least one line item is required";
  } else {
    lineItems.forEach((item, i) => {
      if (!item.sku.trim()) errs[`lineItems.${i}.sku`] = "SKU is required";
      if (!item.quantity || item.quantity < 1)
        errs[`lineItems.${i}.quantity`] = "Quantity must be at least 1";
    });
  }
  if (!customerName.trim()) errs.customerName = "Customer name is required";
  if (!customerEmail.trim()) {
    errs.customerEmail = "Customer email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    errs.customerEmail = "Must be a valid email address";
  }
  if (!shippingAddress.address1.trim())
    errs["shippingAddress.address1"] = "Street address is required";
  if (!shippingAddress.city.trim())
    errs["shippingAddress.city"] = "City is required";
  if (!shippingAddress.province.trim())
    errs["shippingAddress.province"] = "State / Province is required";
  if (!shippingAddress.zip.trim())
    errs["shippingAddress.zip"] = "ZIP / Postal code is required";
  if (!shippingAddress.country.trim())
    errs["shippingAddress.country"] = "Country is required";

  return errs;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderForm({
  onSubmit,
  isSubmitting,
  submitLabel = "Create Order",
}: OrderFormProps) {
  const [orderNo, setOrderNo] = useState("");
  const [lineItems, setLineItems] = useState<OrderLineItem[]>([
    { ...DEFAULT_LINE_ITEM },
  ]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] =
    useState<ShippingAddress>({ ...DEFAULT_ADDRESS });
  const [orderTags, setOrderTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [tagInput, setTagInput] = useState("");

  // ── Line item helpers ──────────────────────────────────────────────────────

  const updateLineItem = useCallback(
    (index: number, field: keyof OrderLineItem, value: string | number) => {
      setLineItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      );
      setErrors((prev) => ({
        ...prev,
        [`lineItems.${index}.${field}`]: undefined,
        lineItems: undefined,
      }));
    },
    [],
  );

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, { ...DEFAULT_LINE_ITEM }]);
  }, []);

  const removeLineItem = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Address helper ─────────────────────────────────────────────────────────

  const setAddressField = useCallback(
    (key: keyof ShippingAddress, value: string) => {
      setShippingAddress((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [`shippingAddress.${key}`]: undefined }));
    },
    [],
  );

  // ── Tag management ─────────────────────────────────────────────────────────

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (!trimmed || orderTags.includes(trimmed)) return;
    setOrderTags((prev) => [...prev, trimmed]);
    setTagInput("");
  }, [tagInput, orderTags]);

  const removeTag = useCallback((tag: string) => {
    setOrderTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const errs = validate(
      orderNo,
      lineItems,
      customerName,
      customerEmail,
      shippingAddress,
    );

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      await onSubmit({
        orderNo: orderNo.trim(),
        lineItems,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        shippingAddress,
        orderTags,
        notes: notes.trim() || undefined,
      });
    } catch (err: unknown) {
      setErrors({
        general:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      });
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  const inputClass = (error?: string) =>
    `w-full px-3 py-2 text-sm border bg-white text-gray-900 outline-none focus:ring-1 focus:ring-black transition-colors ${
      error
        ? "border-red-500 focus:ring-red-500"
        : "border-[#f2f2f2] focus:border-black"
    }`;

  const labelClass =
    "block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide";
  const errorClass = "mt-1 text-xs text-red-600";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors.general && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      {/* ── Order Details ── */}
      <section className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 pb-2 border-b border-[#f2f2f2]">
          Order Details
        </h3>
        <div>
          <label className={labelClass} htmlFor="orderNo">
            Order No <span className="text-red-500">*</span>
          </label>
          <input
            id="orderNo"
            type="text"
            className={inputClass(errors.orderNo)}
            value={orderNo}
            onChange={(e) => {
              setOrderNo(e.target.value);
              setErrors((p) => ({ ...p, orderNo: undefined }));
            }}
            placeholder="e.g. #1001"
          />
          {errors.orderNo && <p className={errorClass}>{errors.orderNo}</p>}
        </div>
      </section>

      {/* ── Line Items ── */}
      <section className="mb-6 p-2 border border-black/5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 pb-2 border-b border-[#f2f2f2]">
          Line Items{" "}
          <span className="text-xs text-gray-400 normal-case tracking-normal font-normal">
            (Leave price blank = catalog price)
          </span>
        </h3>
        {errors.lineItems && (
          <p className={`${errorClass} mb-2`}>{errors.lineItems}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-160">
            <thead>
              <tr className="border-b border-[#f2f2f2]">
                <th className="pb-2 pr-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Part No (SKU) <span className="text-red-500">*</span>
                </th>
                <th className="pb-2 pr-2 w-20 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Qty <span className="text-red-500">*</span>
                </th>
                <th className="pb-2 pr-2 w-28 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Price (USD)
                </th>
                <th className="pb-2 pr-2 w-20 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  WIP
                </th>
                <th className="pb-2 pr-2 w-20 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Build
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => {
                const skuError = errors[`lineItems.${idx}.sku`];
                const qtyError = errors[`lineItems.${idx}.quantity`];
                return (
                  <tr key={idx} className="border-b border-[#f2f2f2] align-top">
                    {/* SKU */}
                    <td className="pr-2 py-2">
                      <input
                        type="text"
                        className={inputClass(skuError)}
                        value={item.sku}
                        onChange={(e) => updateLineItem(idx, "sku", e.target.value)}
                        placeholder="e.g. GGB-001"
                      />
                      {skuError && <p className={errorClass}>{skuError}</p>}
                    </td>

                    {/* Quantity */}
                    <td className="pr-2 py-2">
                      <input
                        type="number"
                        min={1}
                        className={inputClass(qtyError)}
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(idx, "quantity", parseInt(e.target.value, 10) || 1)
                        }
                      />
                      {qtyError && <p className={errorClass}>{qtyError}</p>}
                    </td>

                    {/* Price */}
                    <td className="pr-2 py-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        className={inputClass()}
                        value={item.price}
                        onChange={(e) => updateLineItem(idx, "price", e.target.value)}
                        placeholder="0.00"
                      />
                    </td>

                    {/* WIP */}
                    <td className="pr-2 py-2">
                      <input
                        type="number"
                        min={0}
                        className={inputClass()}
                        value={item.wipCount ?? ""}
                        onChange={(e) =>
                          updateLineItem(
                            idx,
                            "wipCount",
                            e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0,
                          )
                        }
                        placeholder="0"
                      />
                    </td>

                    {/* Build */}
                    <td className="pr-2 py-2">
                      <input
                        type="number"
                        min={0}
                        className={inputClass()}
                        value={item.buildCount ?? ""}
                        onChange={(e) =>
                          updateLineItem(
                            idx,
                            "buildCount",
                            e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0,
                          )
                        }
                        placeholder="0"
                      />
                    </td>

                    {/* Remove */}
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        disabled={lineItems.length === 1}
                        className="p-2 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Remove item"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addLineItem}
          className="mt-3 flex items-center gap-1 px-4 py-2 text-xs font-semibold border border-dashed border-gray-300 text-gray-600 hover:border-black hover:text-black transition-colors"
        >
          <Plus className="h-3 w-3" /> Add Another Item
        </button>
      </section>

      {/* ── Customer Details ── */}
      <section className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 pb-2 border-b border-[#f2f2f2]">
          Customer Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="customerName">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="customerName"
              type="text"
              className={inputClass(errors.customerName)}
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setErrors((p) => ({ ...p, customerName: undefined }));
              }}
              placeholder="John Smith"
            />
            {errors.customerName && (
              <p className={errorClass}>{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="customerEmail">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="customerEmail"
              type="email"
              className={inputClass(errors.customerEmail)}
              value={customerEmail}
              onChange={(e) => {
                setCustomerEmail(e.target.value);
                setErrors((p) => ({ ...p, customerEmail: undefined }));
              }}
              placeholder="john@example.com"
            />
            {errors.customerEmail && (
              <p className={errorClass}>{errors.customerEmail}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Shipping Address ── */}
      <section className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 pb-2 border-b border-[#f2f2f2]">
          Shipping Address
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass} htmlFor="address1">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              id="address1"
              type="text"
              className={inputClass(errors["shippingAddress.address1"])}
              value={shippingAddress.address1}
              onChange={(e) => setAddressField("address1", e.target.value)}
              placeholder="123 Main Street"
            />
            {errors["shippingAddress.address1"] && (
              <p className={errorClass}>{errors["shippingAddress.address1"]}</p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="address2">
              Apartment, Suite, etc.
            </label>
            <input
              id="address2"
              type="text"
              className={inputClass()}
              value={shippingAddress.address2}
              onChange={(e) => setAddressField("address2", e.target.value)}
              placeholder="Apt 4B"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="city">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="city"
                type="text"
                className={inputClass(errors["shippingAddress.city"])}
                value={shippingAddress.city}
                onChange={(e) => setAddressField("city", e.target.value)}
                placeholder="Denver"
              />
              {errors["shippingAddress.city"] && (
                <p className={errorClass}>{errors["shippingAddress.city"]}</p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="province">
                State / Province <span className="text-red-500">*</span>
              </label>
              <input
                id="province"
                type="text"
                className={inputClass(errors["shippingAddress.province"])}
                value={shippingAddress.province}
                onChange={(e) => setAddressField("province", e.target.value)}
                placeholder="CO"
              />
              {errors["shippingAddress.province"] && (
                <p className={errorClass}>
                  {errors["shippingAddress.province"]}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="zip">
                ZIP / Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                id="zip"
                type="text"
                className={inputClass(errors["shippingAddress.zip"])}
                value={shippingAddress.zip}
                onChange={(e) => setAddressField("zip", e.target.value)}
                placeholder="80202"
              />
              {errors["shippingAddress.zip"] && (
                <p className={errorClass}>{errors["shippingAddress.zip"]}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="country">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              id="country"
              type="text"
              className={inputClass(errors["shippingAddress.country"])}
              value={shippingAddress.country}
              onChange={(e) => setAddressField("country", e.target.value)}
              placeholder="United States"
            />
            {errors["shippingAddress.country"] && (
              <p className={errorClass}>{errors["shippingAddress.country"]}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Order Tags ── */}
      <section className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 pb-2 border-b border-[#f2f2f2]">
          Order Tags
        </h3>
        {orderTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {orderTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white text-xs font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-gray-300 transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 text-sm border border-[#f2f2f2] bg-white text-gray-900 outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type a tag and press Enter or comma"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 text-sm font-medium border border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
          >
            Add
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Separate tags with Enter or comma
        </p>
      </section>

      {/* ── Notes ── */}
      <section className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 pb-2 border-b border-[#f2f2f2]">
          Notes
        </h3>
        <textarea
          className="w-full px-3 py-2 text-sm border border-[#f2f2f2] bg-white text-gray-900 outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors resize-none"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes about this order…"
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-gray-400 text-right">
          {notes.length} / 1000
        </p>
      </section>

      {/* ── Submit ── */}
      <div className="flex justify-end pt-2 border-t border-[#f2f2f2]">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-black text-white text-sm font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
