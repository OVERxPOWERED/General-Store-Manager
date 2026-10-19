"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface PaymentInput {
  amount: number;
  note?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form states
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);

  const [addForm, setAddForm] = useState({ name: "", phone: "" });
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [paymentForm, setPaymentForm] = useState<PaymentInput>({ amount: 0, note: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      const data = await response.json();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          phone: addForm.phone.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create customer");
      }

      toast.success("Customer created successfully");
      setShowAddModal(false);
      setAddForm({ name: "", phone: "" });
      fetchCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editForm.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          phone: editForm.phone.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update customer");
      }

      toast.success("Customer updated successfully");
      setShowEditModal(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/customers/${deletingCustomer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete customer");
      }

      toast.success("Customer deleted successfully");
      setShowDeleteModal(false);
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer || paymentForm.amount <= 0) {
      toast.error("Valid payment amount is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/customers/${paymentCustomer.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentForm.amount,
          note: paymentForm.note.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to record payment");
      }

      toast.success("Payment recorded successfully");
      setShowPaymentModal(false);
      setPaymentCustomer(null);
      setPaymentForm({ amount: 0, note: "" });
      fetchCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({ name: customer.name, phone: customer.phone || "" });
    setShowEditModal(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setDeletingCustomer(customer);
    setShowDeleteModal(true);
  };

  const openPaymentModal = (customer: Customer) => {
    setPaymentCustomer(customer);
    setPaymentForm({ amount: 0, note: "" });
    setShowPaymentModal(true);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600 dark:text-green-400";
    if (balance < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getBalanceLabel = (balance: number) => {
    if (balance > 0) return "Credit";
    if