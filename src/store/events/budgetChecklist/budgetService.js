import api from "@/services/axios";

export const getBudgetTypesApi = (params) => {
  return api.get(
    `/smartOffice/getBudgetType`,
    {
      params,
    }
  );
};

export const getBudgetCategoriesApi = (params) => {
  return api.get(
    `/smartOffice/getBudgetCategory`,
    {
      params,
    }
  );
};

export const addBudgetCategoryApi = (payload) => {
  return api.post(
    `/smartOffice/addBudgetCategory`,
    payload
  );
};

export const removeBudgetCategoryApi = (payload) => {
  return api.delete(
    "/smartOffice/removeBudgetCategory",
    {
      data: payload,
    }
  );
};