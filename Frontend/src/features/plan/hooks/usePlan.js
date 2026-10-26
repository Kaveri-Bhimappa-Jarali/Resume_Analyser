import { useState } from "react";
import * as planAPI from "../services/plan.api";

export const usePlan = () => {
  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await planAPI.getPlans();
      const list = data?.plans || [];
      setPlans(list);
      if (list.length > 0 && !plan) {
        setPlan(list[0]);
      }
      return list;
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanById = async (planId) => {
    setLoading(true);
    try {
      const data = await planAPI.getPlanById(planId);
      if (data?.plan) {
        setPlan(data.plan);
      }
    } catch (err) {
      console.error("Failed to fetch plan by ID:", err);
    } finally {
      setLoading(false);
    }
  };

  const createNewPlan = async (payload) => {
    const data = await planAPI.createPlan(payload);
    if (data?.plan) {
      setPlans((prev) => [data.plan, ...prev]);
      setPlan(data.plan);
    }
    return data?.plan;
  };

  const updateLocalPlansList = (updatedPlan) => {
    if (!updatedPlan) return;
    setPlan(updatedPlan);
    setPlans((prev) =>
      prev.map((p) => (p._id === updatedPlan._id ? updatedPlan : p))
    );
  };

  const toggleTask = async (planId, dayIndex, taskIndex) => {
    const data = await planAPI.toggleTask(planId, dayIndex, taskIndex);
    updateLocalPlansList(data?.plan);
  };

  const addTask = async (planId, dayIndex, text) => {
    const data = await planAPI.addTask(planId, dayIndex, text);
    updateLocalPlansList(data?.plan);
  };

  const deleteTask = async (planId, dayIndex, taskIndex) => {
    const data = await planAPI.deleteTask(planId, dayIndex, taskIndex);
    updateLocalPlansList(data?.plan);
  };

  return {
    plans,
    plan,
    loading,
    fetchPlans,
    fetchPlanById,
    createNewPlan,
    toggleTask,
    addTask,
    deleteTask,
  };
};