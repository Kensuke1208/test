import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useLearners() {
  return useQuery({
    queryKey: ["learners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learners")
        .select("id, display_name")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}
