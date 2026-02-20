import api from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      roomData,
    }: {
      roomId: string;
      roomData: any;
    }) => {
      // Remove _id, currentOccupancy, currentKids, and status before sending
      const { _id, currentOccupancy, currentKids, status, ...payload } = roomData;

      const res = await api.patch(`/room/${roomId}`, payload);
      return res.data.room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
};
