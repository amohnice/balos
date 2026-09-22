'use client';

import { useEffect, useState } from 'react';
import { useActiveBusiness } from '@/contexts/ActiveBusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import RequireRole from '@/components/RequireRole';

export default function NewSalePage() {
  const { activeBusinessId: businessId } = useActiveBusiness();
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api.sales
      .getActiveCategories(businessId)
      .then((res: any) => {
        setCategories(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        toast(err.message || 'Failed to fetch categories', 'error');
        setLoading(false);
      });
  }, [businessId, toast]);

  const addToCart = (category: any) => {
    const existing = cart.find((item) => item.categoryId === category.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.categoryId === category.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          categoryId: category.id,
          name: category.name,
          quantity: 1,
          unitPrice: category.currentPrice,
          minPrice: category.currentPrice,
          pricingMode: category.pricingMode,
          totalPrice: category.currentPrice,
        },
      ]);
    }
    toast(`Added ${category.name} to cart`, 'success');
  };

  const updateUnitPrice = (categoryId: string, price: number) => {
    setCart(
      cart.map((item) => {
        if (item.categoryId === categoryId) {
          const finalPrice = Math.max(item.minPrice, price);
          return {
            ...item,
            unitPrice: finalPrice,
            totalPrice: item.quantity * finalPrice,
          };
        }
        return item;
      })
    );
  };

  const updateQuantity = (categoryId: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.categoryId === categoryId
            ? {
                ...item,
                quantity: Math.max(1, item.quantity + delta),
                totalPrice: Math.max(1, item.quantity + delta) * item.unitPrice,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (categoryId: string) => {
    setCart(cart.filter((item) => item.categoryId !== categoryId));
  };

  const handleSubmit = async () => {
    if (cart.length === 0 || !businessId) return;
    setSubmitting(true);

    try {
      await api.sales.create(businessId, {
        items: cart.map((item) => ({
          categoryId: item.categoryId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        paymentMethod,
      });
      setCart([]);
      setIsMobileCartOpen(false);
      toast('Sale completed successfully!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to complete sale', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  if (loading)
    return (
      <div className="flex h-60 items-center justify-center p-4">
        <Spinner size="md" className="text-gray-900" />
      </div>
    );

  if (!businessId) return <div className="p-6 text-gray-500">No active business selected.</div>;

  return (
    <RequireRole
      businessId={businessId ?? undefined}
      businessRoles={['OWNER', 'MANAGER', 'CASHIER']}
      fallback={<div className="p-4 text-gray-500">Insufficient permissions to create sales.</div>}
    >
      <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Point of Sale (POS)</h1>
          <Badge variant="default" className="text-xs">
            {categories.length} Categories Available
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Categories Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-light text-gray-900 tracking-tight">Available Stock Items</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              {categories.length === 0 ? (
                <p className="text-gray-500 col-span-full py-8 text-center">
                  No approved stock categories available for sale.
                </p>
              ) : (
                categories.map((category) => (
                  <Card key={category.id} className="hover:shadow-md transition border-gray-200">
                    <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 truncate">{category.name}</p>
                          {category.status === 'CLEARANCE' && (
                            <Badge variant="danger">
                              CLEARANCE
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">Ref: {category.bale?.referenceNo || 'Bale Item'}</p>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          KES {category.currentPrice.toLocaleString()}
                        </p>
                      </div>
                      <Button className="w-full" size="sm" onClick={() => addToCart(category)}>
                        + Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Desktop Cart Column */}
          <div className="hidden md:block space-y-4">
            <h2 className="text-lg font-light text-gray-900 tracking-tight">Current Order</h2>
            <Card className="sticky top-24">
              <CardContent className="p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-gray-400 text-center py-12 space-y-2">
                    <p className="text-base font-medium text-gray-600">Cart is empty</p>
                    <p className="text-xs">Select items on the left to build the customer&apos;s sale</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.categoryId} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {item.pricingMode === 'FIXED' ? 'Fixed Price' : `Min: KES ${item.minPrice}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button size="sm" variant="secondary" onClick={() => updateQuantity(item.categoryId, -1)}>
                                -
                              </Button>
                              <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                              <Button size="sm" variant="secondary" onClick={() => updateQuantity(item.categoryId, 1)}>
                                +
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => removeFromCart(item.categoryId)}>
                                ×
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-200/60">
                            <span className="text-xs text-gray-500">Unit Price:</span>
                            {item.pricingMode === 'FIXED' ? (
                              <span className="font-semibold text-gray-900">KES {item.unitPrice.toLocaleString()}</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-400">KES</span>
                                <Input
                                  type="number"
                                  min={item.minPrice}
                                  value={item.unitPrice}
                                  onChange={(e) => updateUnitPrice(item.categoryId, Number(e.target.value))}
                                  className="px-2 py-0.5 text-sm text-right font-medium"
                                  containerClassName="w-24"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-gray-500">Total Amount:</span>
                        <span className="text-2xl font-extrabold text-gray-900">KES {total.toLocaleString()}</span>
                      </div>

                      <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} label="Payment Method">
                        <option value="CASH">Cash</option>
                        <option value="MPESA">M-PESA</option>
                        <option value="CARD">Card</option>
                      </Select>

                      <Button className="w-full py-3 text-base font-medium" onClick={handleSubmit} disabled={submitting || cart.length === 0}>
                        {submitting ? 'Processing...' : 'Complete Sale'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Sticky POS Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4 shadow-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{cart.length} item(s) selected</p>
            <p className="text-xl font-bold text-gray-900">KES {total.toLocaleString()}</p>
          </div>
          <Button onClick={() => setIsMobileCartOpen(true)} disabled={cart.length === 0}>
            View Cart ({cart.length})
          </Button>
        </div>

        {/* Mobile Cart Drawer Modal */}
        {isMobileCartOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Cart & Checkout</h2>
              <button onClick={() => setIsMobileCartOpen(false)} className="text-gray-500 text-xl font-bold p-1">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.categoryId} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.pricingMode === 'FIXED' ? 'Fixed Price' : `Min: KES ${item.minPrice}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => updateQuantity(item.categoryId, -1)}>
                        -
                      </Button>
                      <span className="w-6 text-center font-bold">{item.quantity}</span>
                      <Button size="sm" variant="secondary" onClick={() => updateQuantity(item.categoryId, 1)}>
                        +
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => removeFromCart(item.categoryId)}>
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 space-y-3 bg-gray-50">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-600">Total:</span>
                <span className="text-2xl font-extrabold text-gray-900">KES {total.toLocaleString()}</span>
              </div>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} label="Payment Method">
                <option value="CASH">Cash</option>
                <option value="MPESA">M-PESA</option>
                <option value="CARD">Card</option>
              </Select>
              <Button className="w-full py-3" onClick={handleSubmit} disabled={submitting || cart.length === 0}>
                {submitting ? 'Processing...' : 'Complete Sale'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
