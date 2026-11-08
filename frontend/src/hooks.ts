import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { api, Item, Project } from "@/src/api";
import { toast } from "@/src/ui";

export function useProject(id: string) {
  return useQuery({ queryKey: ["project", id], queryFn: () => api<Project>(`/projects/${id}`) });
}

export function useSummary(id: string) {
  return useQuery({ queryKey: ["summary", id], queryFn: () => api<Record<string, number>>(`/projects/${id}/summary`) });
}

export function useItems(pid: string, module: string) {
  return useQuery({ queryKey: ["items", pid, module], queryFn: () => api<Item[]>(`/projects/${pid}/items?module=${module}`) });
}

export function useAllItems(pid: string) {
  return useQuery({ queryKey: ["items", pid, "__all"], queryFn: () => api<Item[]>(`/projects/${pid}/items`) });
}

export function useLookup(pid: string) {
  const q = useAllItems(pid);
  return useMemo(() => new Map((q.data ?? []).map((i) => [i.id, i])), [q.data]);
}

export function useInvalidateProject(pid: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["items", pid] });
    qc.invalidateQueries({ queryKey: ["summary", pid] });
  };
}

export const READ_ONLY_MSG = "Hai accesso in sola visione a questo progetto";

export function useItemMutations(pid: string, module: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateProject(pid);
  const guard = () => {
    if (qc.getQueryData<Project>(["project", pid])?.my_role === "viewer") {
      toast(READ_ONLY_MSG, "error");
      throw new Error(READ_ONLY_MSG);
    }
  };

  const create = useMutation({
    mutationFn: (body: { title: string; data: Record<string, any>; module?: string }) => {
      guard();
      return api<Item>(`/projects/${pid}/items`, { method: "POST", body: { module, ...body } });
    },
    onSuccess: (item) => {
      qc.setQueryData<Item[]>(["items", pid, module], (old) =>
        old?.some((i) => i.id === item.id) ? old : [...(old ?? []), item]
      );
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; data?: Record<string, any>; order?: number }) => {
      guard();
      return api<Item>(`/items/${id}`, { method: "PUT", body });
    },
    onMutate: async ({ id, ...body }) => {
      await qc.cancelQueries({ queryKey: ["items", pid, module] });
      const previous = qc.getQueryData<Item[]>(["items", pid, module]);
      qc.setQueryData<Item[]>(["items", pid, module], (old) =>
        (old ?? []).map((i) => (i.id === id ? { ...i, ...body, updated_at: new Date().toISOString() } : i))
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["items", pid, module], ctx.previous);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => {
      guard();
      return api(`/items/${id}`, { method: "DELETE" });
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["items", pid, module] });
      const previous = qc.getQueryData<Item[]>(["items", pid, module]);
      qc.setQueryData<Item[]>(["items", pid, module], (old) => (old ?? []).filter((i) => i.id !== id));
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["items", pid, module], ctx.previous);
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export type LibItem = { id: string; kind: string; title: string; data: Record<string, any>; created_at: string };

export function useLibrary(kind: string) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["library", kind], queryFn: () => api<LibItem[]>(`/library?kind=${kind}`) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["library", kind] });
  const create = useMutation({
    mutationFn: (items: { title: string; data: Record<string, any> }[]) => api(`/library/bulk`, { method: "POST", body: { kind, items } }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; title: string; data: Record<string, any> }) => api(`/library/${id}`, { method: "PUT", body }),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: string) => api(`/library/${id}`, { method: "DELETE" }), onSuccess: invalidate });
  return { q, create, update, remove };
}
