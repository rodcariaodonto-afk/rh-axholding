import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, Upload, FileText, ArrowRight } from "lucide-react";
import { useBrazilianCities } from "@/hooks/useBrazilianCities";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { TALENT_BANK_JOB_ID, TALENT_BANK_DESCRIPTION } from "@/constants/talentBank";
import {
  BRAZILIAN_STATES,
  RACE_OPTIONS,
  GENDER_OPTIONS,
  SEXUAL_ORIENTATION_OPTIONS,
  PCD_TYPE_OPTIONS,
} from "@/constants/brazilData";

// Seniority options are fetched dynamically from job_descriptions

// Age validation constants (16-100 years)
const today = new Date();
const minBirthDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
const maxBirthDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
const defaultBirthMonth = new Date(today.getFullYear() - 25, 0);

const TalentBankApplication = () => {
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState<Date>();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // New demographic fields
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [race, setRace] = useState("");
  const [gender, setGender] = useState("");
  const [sexualOrientation, setSexualOrientation] = useState("");
  const [isPcd, setIsPcd] = useState<string>("");
  const [pcdType, setPcdType] = useState("");

  // Talent bank specific fields
  const [desiredPosition, setDesiredPosition] = useState("");
  const [desiredSeniority, setDesiredSeniority] = useState("");

  const { cities, isLoading: citiesLoading } = useBrazilianCities(state);

  // Fetch unique position types from job_descriptions
  const { data: positionTypes } = useQuery({
    queryKey: ["job-description-position-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_descriptions")
        .select("position_type")
        .order("position_type");

      if (error) throw error;
      
      const uniquePositions = [...new Set(data.map(d => d.position_type))];
      return uniquePositions;
    },
  });

  // Fetch unique seniority levels from job_descriptions
  const { data: seniorityLevels } = useQuery({
    queryKey: ["job-description-seniority-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_descriptions")
        .select("seniority")
        .order("seniority");

      if (error) throw error;
      
      const uniqueSeniorities = [...new Set(data.map(d => d.seniority))];
      return uniqueSeniorities;
    },
  });

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError("E-mail é obrigatório");
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError("E-mail inválido");
      return false;
    }
    setEmailError("");
    return true;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    
    if (digits.length <= 2) {
      return digits.length > 0 ? `(${digits}` : "";
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const validatePhone = (value: string) => {
    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (!value) {
      setPhoneError("Telefone é obrigatório");
      return false;
    }
    if (!phoneRegex.test(value)) {
      setPhoneError("Formato inválido. Use (xx) xxxxx-xxxx");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setPhone(formatted);
    if (formatted.length === 15) {
      validatePhone(formatted);
    } else {
      setPhoneError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value) validateEmail(value);
  };

  const handleStateChange = (value: string) => {
    setState(value);
    setCity("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Formato inválido",
          description: "Por favor, envie um arquivo PDF.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const uploadResume = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const filePath = `talent-bank/${fileName}`;

    const { error } = await supabase.storage
      .from("resumes")
      .upload(filePath, file, {
        contentType: "application/pdf",
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    return filePath;
  };

  const handleProceedToProfiler = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!validateEmail(email)) return;
    if (!validatePhone(phone)) return;
    
    if (!fullName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome completo.",
        variant: "destructive",
      });
      return;
    }
    if (!birthDate) {
      toast({
        title: "Data de nascimento obrigatória",
        description: "Por favor, informe sua data de nascimento.",
        variant: "destructive",
      });
      return;
    }
    
    // Age validation (16-100 years)
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    
    if (adjustedAge < 16 || adjustedAge > 100) {
      toast({
        title: "Idade inválida",
        description: "Você deve ter entre 16 e 100 anos para se candidatar.",
        variant: "destructive",
      });
      return;
    }
    if (!resumeFile) {
      toast({
        title: "Currículo obrigatório",
        description: "Por favor, envie seu currículo em PDF.",
        variant: "destructive",
      });
      return;
    }
    if (!state || !city) {
      toast({
        title: "Localização obrigatória",
        description: "Por favor, selecione seu estado e cidade.",
        variant: "destructive",
      });
      return;
    }
    if (!race || !gender || !sexualOrientation) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos demográficos.",
        variant: "destructive",
      });
      return;
    }
    if (!isPcd) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe se você é PCD.",
        variant: "destructive",
      });
      return;
    }
    if (isPcd === "sim" && !pcdType) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o tipo de deficiência.",
        variant: "destructive",
      });
      return;
    }

    // Talent bank specific validations
    if (!desiredPosition) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione o cargo pretendido.",
        variant: "destructive",
      });
      return;
    }
    if (!desiredSeniority) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione a senioridade.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload resume first
      const resumeUrl = await uploadResume(resumeFile);

      // Save candidate data to sessionStorage for later submission
      const candidateData = {
        job_id: TALENT_BANK_JOB_ID,
        candidate_name: fullName,
        candidate_email: email,
        candidate_birth_date: format(birthDate, "yyyy-MM-dd"),
        resume_url: resumeUrl,
        candidate_state: state,
        candidate_city: city,
        candidate_phone: phone,
        candidate_race: race,
        candidate_gender: gender,
        candidate_sexual_orientation: sexualOrientation,
        candidate_pcd: isPcd === "sim",
        candidate_pcd_type: isPcd === "sim" ? pcdType : null,
        desired_position: desiredPosition,
        desired_seniority: desiredSeniority,
        is_talent_bank: true,
        job_data: {
          title: "Banco de Talentos",
          description: TALENT_BANK_DESCRIPTION,
          requirements: null,
          position: null,
          department: null,
        },
      };

      sessionStorage.setItem("pending_application", JSON.stringify(candidateData));

      toast({
        title: "Dados salvos!",
        description: "Agora você precisa responder ao teste de perfil comportamental.",
      });

      // Navigate to profiler with application context
      navigate(`/profiler-intro?applicationId=${TALENT_BANK_JOB_ID}`);
    } catch (error) {
      console.error("Error saving data:", error);
      toast({
        title: "Erro ao salvar dados",
        description: "Ocorreu um erro ao salvar seus dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Job Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Banco de Talentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert [&>*]:text-foreground [&_p]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_strong]:text-foreground [&_li]:text-foreground [&_ul]:my-2 [&_li]:my-0">
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>{TALENT_BANK_DESCRIPTION}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Candidatar-se</CardTitle>
            <CardDescription>
              Preencha os campos abaixo. Após salvar, você responderá ao teste de perfil comportamental.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProceedToProfiler} className="space-y-6">
              {/* Personal Info Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Informações Pessoais
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                {/* Talent Bank specific fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cargo Pretendido *</Label>
                    <Select value={desiredPosition} onValueChange={setDesiredPosition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {positionTypes?.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Senioridade *</Label>
                    <Select value={desiredSeniority} onValueChange={setDesiredSeniority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a senioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        {seniorityLevels?.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data de Nascimento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !birthDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthDate ? (
                          format(birthDate, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={setBirthDate}
                        disabled={(date) =>
                          date > maxBirthDate || date < minBirthDate
                        }
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={minBirthDate.getFullYear()}
                        toYear={maxBirthDate.getFullYear()}
                        defaultMonth={defaultBirthMonth}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Você deve ter entre 16 e 100 anos para se candidatar.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="seu@email.com"
                    className={emailError ? "border-destructive" : ""}
                    required
                  />
                  {emailError && (
                    <p className="text-sm text-destructive">{emailError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(xx) xxxxx-xxxx"
                    className={phoneError ? "border-destructive" : ""}
                    required
                  />
                  {phoneError && (
                    <p className="text-sm text-destructive">{phoneError}</p>
                  )}
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Localização
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Select value={state} onValueChange={handleStateChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAZILIAN_STATES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cidade *</Label>
                    <Select 
                      value={city} 
                      onValueChange={setCity}
                      disabled={!state || citiesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={citiesLoading ? "Carregando..." : "Selecione a cidade"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Demographics Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Diversidade e Inclusão
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Raça/Etnia *</Label>
                    <Select value={race} onValueChange={setRace}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {RACE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gênero *</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Orientação Sexual *</Label>
                    <Select value={sexualOrientation} onValueChange={setSexualOrientation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEXUAL_ORIENTATION_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pessoa com Deficiência (PCD)? *</Label>
                    <RadioGroup value={isPcd} onValueChange={setIsPcd}>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id="pcd-sim" />
                          <Label htmlFor="pcd-sim" className="font-normal">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id="pcd-nao" />
                          <Label htmlFor="pcd-nao" className="font-normal">Não</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {isPcd === "sim" && (
                    <div className="space-y-2">
                      <Label>Tipo de Deficiência *</Label>
                      <Select value={pcdType} onValueChange={setPcdType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                        {PCD_TYPE_OPTIONS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Resume Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Currículo
                </h3>

                <div className="space-y-2">
                  <Label>Upload do Currículo (PDF) *</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("resume-upload")?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Escolher arquivo
                    </Button>
                    {resumeFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {resumeFile.name}
                      </div>
                    )}
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formato aceito: PDF. Tamanho máximo: 10MB.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={uploading}
              >
                {uploading ? (
                  "Salvando..."
                ) : (
                  <>
                    Prosseguir para Teste de Perfil
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalentBankApplication;
