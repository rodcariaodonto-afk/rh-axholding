import { useState, useEffect } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCompanyCulture, useUpdateCompanyCulture, CultureValue } from "@/hooks/useCompanyCulture";
import { useUserRole } from "@/hooks/useUserRole";

const Culture = () => {
  const { data: culture, isLoading } = useCompanyCulture();
  const updateCulture = useUpdateCompanyCulture();
  const { isAdmin, isPeople } = useUserRole();
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = isAdmin || isPeople;

  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [values, setValues] = useState<CultureValue[]>([]);
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [opportunities, setOpportunities] = useState("");
  const [threats, setThreats] = useState("");

  useEffect(() => {
    if (culture) {
      setMission(culture.mission || "");
      setVision(culture.vision || "");
      setValues(culture.values || []);
      setStrengths(culture.swot_strengths || "");
      setWeaknesses(culture.swot_weaknesses || "");
      setOpportunities(culture.swot_opportunities || "");
      setThreats(culture.swot_threats || "");
    }
  }, [culture]);

  const handleSave = () => {
    updateCulture.mutate({
      mission,
      vision,
      values,
      swot_strengths: strengths,
      swot_weaknesses: weaknesses,
      swot_opportunities: opportunities,
      swot_threats: threats,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (culture) {
      setMission(culture.mission || "");
      setVision(culture.vision || "");
      setValues(culture.values || []);
      setStrengths(culture.swot_strengths || "");
      setWeaknesses(culture.swot_weaknesses || "");
      setOpportunities(culture.swot_opportunities || "");
      setThreats(culture.swot_threats || "");
    }
    setIsEditing(false);
  };

  const addValue = () => {
    setValues([...values, { name: "", bullets: "" }]);
  };

  const removeValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const updateValue = (index: number, field: keyof CultureValue, value: string) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], [field]: value };
    setValues(newValues);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Cultura Organizacional</h1>
          {!isEditing && canEdit && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>

        {isEditing ? (
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Missão */}
              <div className="grid grid-cols-[150px_1fr] gap-4 items-start">
                <span className="font-semibold text-muted-foreground pt-2">Missão</span>
                <Textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Visão */}
              <div className="grid grid-cols-[150px_1fr] gap-4 items-start">
                <span className="font-semibold text-muted-foreground pt-2">Visão</span>
                <Textarea
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Valores */}
              <div className="grid grid-cols-[150px_1fr] gap-4 items-start">
                <span className="font-semibold text-muted-foreground pt-2">Valores</span>
                <div className="space-y-4">
                  {values.map((value, index) => (
                    <div key={index} className="border border-border rounded-md p-4 space-y-3">
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="Nome do valor"
                          value={value.name}
                          onChange={(e) => updateValue(index, "name", e.target.value)}
                          className="font-medium"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeValue(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Bullet points (um por linha)"
                        value={value.bullets}
                        onChange={(e) => updateValue(index, "bullets", e.target.value)}
                        rows={4}
                      />
                    </div>
                  ))}
                  <Button variant="outline" onClick={addValue} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Valor
                  </Button>
                </div>
              </div>

              <Separator />

              {/* SWOT */}
              <div className="grid grid-cols-[150px_1fr] gap-4 items-start">
                <span className="font-semibold text-muted-foreground pt-2">Pontos fortes</span>
                <Textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-[150px_1fr] gap-4 items-start">
                <span className="font-semibold text-muted-foreground pt-2">Pontos fracos</span>
                <Textarea
                  value={weaknesses}
                  onChange={(e) => setWeaknesses(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-[150px_1fr] gap-4 items-start">
                <span className="font-semibold text-muted-foreground pt-2">Oportunidades</span>
                <Textarea
                  value={opportunities}
                  onChange={(e) => setOpportunities(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-[150px_1fr] gap-4 items-start">
                <span className="font-semibold text-muted-foreground pt-2">Ameaças</span>
                <Textarea
                  value={threats}
                  onChange={(e) => setThreats(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateCulture.isPending}>
                  Salvar
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Missão</h2>
              <p className="text-left max-w-4xl mx-auto">{culture?.mission || "-"}</p>
            </div>

            <Separator />

            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Visão</h2>
              <p className="text-left max-w-4xl mx-auto">{culture?.vision || "-"}</p>
            </div>

            <Separator />

            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Valores</h2>
              <div className="text-left max-w-4xl mx-auto space-y-4">
                {values.length > 0 ? (
                  values.map((value, index) => (
                    <div key={index}>
                      <h3 className="font-semibold">{value.name}:</h3>
                      <div className="ml-4">
                        {value.bullets.split("\n").map((bullet, i) => (
                          bullet.trim() && <p key={i}>{bullet}</p>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhum valor cadastrado.</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Matriz SWOT</h2>
              <div className="max-w-5xl mx-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr>
                      <th className="border border-border p-3 bg-muted text-muted-foreground w-24">SWOT</th>
                      <th className="border border-border p-3 bg-muted text-muted-foreground">Positivo</th>
                      <th className="border border-border p-3 bg-muted text-muted-foreground">Negativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3 text-center text-sm text-muted-foreground align-middle">
                        <div className="writing-mode-vertical">Internos<br />(Organização)</div>
                      </td>
                      <td className="border border-border p-4 text-left align-top">
                        <h4 className="font-semibold mb-2">Pontos fortes</h4>
                        <div className="text-sm">
                          {culture?.swot_strengths?.split("\n").map((item, i) => (
                            item.trim() && <p key={i}>{item}</p>
                          ))}
                        </div>
                      </td>
                      <td className="border border-border p-4 text-left align-top">
                        <h4 className="font-semibold mb-2">Pontos fracos</h4>
                        <div className="text-sm">
                          {culture?.swot_weaknesses?.split("\n").map((item, i) => (
                            item.trim() && <p key={i}>{item}</p>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 text-center text-sm text-muted-foreground align-middle">
                        <div className="writing-mode-vertical">Externos<br />(Ambiente)</div>
                      </td>
                      <td className="border border-border p-4 text-left align-top">
                        <h4 className="font-semibold mb-2">Oportunidades</h4>
                        <div className="text-sm">
                          {culture?.swot_opportunities?.split("\n").map((item, i) => (
                            item.trim() && <p key={i}>{item}</p>
                          ))}
                        </div>
                      </td>
                      <td className="border border-border p-4 text-left align-top">
                        <h4 className="font-semibold mb-2">Ameaças</h4>
                        <div className="text-sm">
                          {culture?.swot_threats?.split("\n").map((item, i) => (
                            item.trim() && <p key={i}>{item}</p>
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Culture;
