'use client';

import { useState, useCallback } from 'react';

export interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
}

export interface PaginationState {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
}

export function usePagination({ initialPage = 1, initialLimit = 10 }: UsePaginationProps = {}) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    totalPages: 0,
    totalCount: 0,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setTotalPages = useCallback((totalPages: number) => {
    setPagination((prev) => ({ ...prev, totalPages }));
  }, []);

  const setTotalCount = useCallback((totalCount: number) => {
    setPagination((prev) => ({ ...prev, totalCount }));
  }, []);

  const nextPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: Math.min(prev.page + 1, prev.totalPages),
    }));
  }, []);

  const prevPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(prev.page - 1, 1),
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, Math.min(page, prev.totalPages)),
    }));
  }, []);

  return {
    pagination,
    setPage,
    setLimit,
    setTotalPages,
    setTotalCount,
    nextPage,
    prevPage,
    goToPage,
  };
}
