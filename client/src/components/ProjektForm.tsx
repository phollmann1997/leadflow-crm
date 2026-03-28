import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PIPELINE_LABELS } from "@shared/schema";
import type { Projekt } from "@shared/schema";

const formSchema = z.object({
  nazev: z.string().min(1, "Název je povinný"),
  popis: z.string().optional(),
  stav: z.string().default("novy"),
  hodnotaDealu: z.number().min(0).default(0),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  defaultValues?: Partial<Projekt>;
  onSubmit: (data: FormData) => void;
  isPending?: boolean;
  submitLabel?: string;
}

export default function ProjektForm({ defaultValues, onSubmit, isPending, submitLabel = "Uložit" }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nazev: defaultValues?.nazev ?? "",
      popis: defaultValues?.popis ?? "",
      stav: defaultValues?.stav ?? "novy",
      hodnotaDealu: defaultValues?.hodnotaDealu ?? 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="nazev" render={({ field }) => (
          <FormItem><FormLabel>Název projektu *</FormLabel><FormControl><Input data-testid="input-projekt-nazev" placeholder="Název projektu / dealu" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="stav" render={({ field }) => (
            <FormItem><FormLabel>Stav</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger data-testid="select-projekt-stav"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{Object.entries(PIPELINE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="hodnotaDealu" render={({ field }) => (
            <FormItem><FormLabel>Hodnota dealu (CZK/měs.)</FormLabel><FormControl>
              <Input data-testid="input-projekt-hodnota" type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
            </FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="popis" render={({ field }) => (
          <FormItem><FormLabel>Popis</FormLabel><FormControl>
            <Textarea data-testid="input-projekt-popis" placeholder="Popis projektu, poznámky..." rows={2} {...field} />
          </FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending} data-testid="button-projekt-submit">{isPending ? "Ukládám..." : submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}
