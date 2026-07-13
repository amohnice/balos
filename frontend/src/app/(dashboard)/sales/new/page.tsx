'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { getFirstBusinessId } from '@/lib/business';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import RequireRole from '@/components/RequireRole';

export default function NewSalePage() {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      api.businesses.list().then((res: any) => {
        const id = getFirstBusinessId(res.data);
        if (id) {
          setBusinessId(id);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (businessId) {
      api.sales.getActiveCategories(businessId).then((res: any) => {
        setCategories(res.data || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [businessId]);

  const addToCart = (category: any) => {
    const existing = cart.find((item) => item.categoryId === category.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.categoryId === category.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
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
  };

  const updateUnitPrice = (categoryId: string, price: number) => {
    setCart(cart.map((item) => {
      if (item.categoryId === categoryId) {
        // Enforce that price cannot be lower than minPrice
        const finalPrice = Math.max(item.minPrice, price);
        return {
          ...item,
          unitPrice: finalPrice,
          totalPrice: item.quantity * finalPrice,
        };
      }
      return item;
    }));
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
      alert('Sale completed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to complete sale');
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
  if (!businessId) return <div className="p-4">No business found</div>;

  return (
    <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "MANAGER", "CASHIER"]} fallback={<div className="p-4">Insufficient permissions to create sales.</div>}>
      <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-light text-gray-900 tracking-tight">New Sale</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="space-y-4">
          <h2 className="text-lg font-light text-gray-900 tracking-tight">Select Categories</h2>
          <div className="grid gap-3">
            {categories.map((category) => (
              <Card key={category.id} className="cursor-pointer hover:shadow-md transition">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{category.name}</p>
                      <p className="text-sm text-gray-500">KES {category.currentPrice.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{category.bale.referenceNo}</p>
                    </div>
                    <Badge variant={category.status === 'CLEARANCE' ? 'danger' : 'success'}>
                      {category.status}
                    </Badge>
                  </div>
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    onClick={() => addToCart(category)}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div>
          <h2 className="text-lg font-light text-gray-900 tracking-tight mb-4">Cart</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Cart is empty</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.categoryId} className="flex flex-col p-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.pricingMode === 'FIXED' ? 'Fixed Price' : `Min Price: KES ${item.minPrice}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => updateQuantity(item.categoryId, -1)}>
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button size="sm" variant="secondary" onClick={() => updateQuantity(item.categoryId, 1)}>
                            +
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => removeFromCart(item.categoryId)}>
                            ×
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Unit Price (KES):</span>
                        {item.pricingMode === 'FIXED' ? (
                          <span className="font-semibold">{item.unitPrice.toLocaleString()}</span>
                        ) : (
                          <Input
                            type="number"
                            min={item.minPrice}
                            value={item.unitPrice}
                            onChange={(e) => updateUnitPrice(item.categoryId, Number(e.target.value))}
                            className="px-2 py-0.5 text-sm text-right"
                            containerClassName="w-24"
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>KES {total.toLocaleString()}</span>
                    </div>

                    <div>
                      <Select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        label="Payment Method"
                      >
                        <option value="CASH">Cash</option>
                        <option value="MPESA">M-PESA</option>
                        <option value="CARD">Card</option>
                      </Select>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleSubmit}
                      disabled={submitting || cart.length === 0}
                    >
                      {submitting ? 'Processing...' : 'Complete Sale'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </RequireRole>
  );
}
