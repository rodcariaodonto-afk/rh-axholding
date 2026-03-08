import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

const contactSchema = z.object({
  personal_email: z.string().email().optional().or(z.literal("")),
  mobile_phone: z.string().optional(),
  home_phone: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  country: z.string().min(1),
  zip_code: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
  neighborhood: z.string().optional(),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

interface ContactInfoFormProps {
  contact: any;
  isUpdating: boolean;
  onSubmit: (data: ContactFormData) => void;
}

export function ContactInfoForm({ contact, isUpdating, onSubmit }: ContactInfoFormProps) {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      country: "BR",
      zip_code: "00000-000",
      state: "SP",
      city: "São Paulo",
      street: "A preencher",
      number: "0",
    },
  });

  useEffect(() => {
    if (contact) {
      form.reset({
        personal_email: contact.personal_email || "",
        mobile_phone: contact.mobile_phone || "",
        home_phone: contact.home_phone || "",
        emergency_contact_name: contact.emergency_contact_name || "",
        emergency_contact_phone: contact.emergency_contact_phone || "",
        country: contact.country,
        zip_code: contact.zip_code,
        state: contact.state,
        city: contact.city,
        neighborhood: contact.neighborhood || "",
        street: contact.street,
        number: contact.number,
        complement: contact.complement || "",
      });
    }
  }, [contact, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Contato */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="personal_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Pessoal</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobile_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Celular</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="(00) 00000-0000"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      const formatted = value
                        .replace(/^(\d{2})(\d)/g, "($1) $2")
                        .replace(/(\d{5})(\d)/, "$1-$2")
                        .slice(0, 15);
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="home_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone Fixo</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="(00) 0000-0000"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      const formatted = value
                        .replace(/^(\d{2})(\d)/g, "($1) $2")
                        .replace(/(\d{4})(\d)/, "$1-$2")
                        .slice(0, 14);
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contato de Emergência */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Contato de Emergência</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="emergency_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do contato" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergency_contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="(00) 00000-0000"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        const formatted = value
                          .replace(/^(\d{2})(\d)/g, "($1) $2")
                          .replace(/(\d{5})(\d)/, "$1-$2")
                          .slice(0, 15);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Endereço */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Endereço</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <FormField
              control={form.control}
              name="zip_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      placeholder="00000-000"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        const formatted = value.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
                        field.onChange(formatted);
                      }}
                      onBlur={async (e) => {
                        const cep = e.target.value.replace(/\D/g, "");
                        if (cep.length === 8) {
                          try {
                            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                            const data = await response.json();
                            if (!data.erro) {
                              form.setValue("street", data.logradouro || "");
                              form.setValue("neighborhood", data.bairro || "");
                              form.setValue("city", data.localidade || "");
                              form.setValue("state", data.uf || "");
                            }
                          } catch (error) {
                            console.error("Erro ao buscar CEP:", error);
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Rua, Av., Travessa..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="complement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Apto, Bloco..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isUpdating}>
          {isUpdating ? "Salvando..." : "Salvar Dados de Contato"}
        </Button>
      </form>
    </Form>
  );
}
