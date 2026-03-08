import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from './useCurrentOrganization';
import { toast } from 'sonner';
import type { FontFamily, RadiusSize, OrganizationAppearance } from '@/types/appearance';

export function useOrganizationAppearance() {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ['organization-appearance', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const { data, error } = await supabase
        .from('organization_appearance')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching organization appearance:', error);
        return null;
      }

      return data as OrganizationAppearance | null;
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });
}

interface UpdateAppearanceParams {
  customCSS?: string;
  colorMode?: 'light' | 'dark' | 'system';
  fontFamily?: FontFamily;
  borderRadius?: RadiusSize;
}

export function useUpdateOrganizationAppearance() {
  const queryClient = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async ({ customCSS, colorMode, fontFamily, borderRadius }: UpdateAppearanceParams) => {
      if (!organizationId) throw new Error('No organization');

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('organization_appearance')
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        const updatePayload: Record<string, unknown> = {
          updated_by: user.user.id,
        };
        
        if (customCSS !== undefined) updatePayload.custom_css = customCSS;
        if (colorMode !== undefined) updatePayload.color_mode = colorMode;
        if (fontFamily !== undefined) updatePayload.font_family = fontFamily;
        if (borderRadius !== undefined) updatePayload.border_radius = borderRadius;

        const { data, error } = await supabase
          .from('organization_appearance')
          .update(updatePayload)
          .eq('organization_id', organizationId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('organization_appearance')
          .insert({
            organization_id: organizationId,
            updated_by: user.user.id,
            custom_css: customCSS ?? '',
            color_mode: colorMode ?? 'dark',
            font_family: fontFamily ?? 'inter',
            border_radius: borderRadius ?? 'md',
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-appearance', organizationId] });
      toast.success('Tema atualizado para toda a organização');
    },
    onError: (error) => {
      console.error('Error updating appearance:', error);
      toast.error('Erro ao atualizar tema. Verifique se você é admin.');
    },
  });
}
