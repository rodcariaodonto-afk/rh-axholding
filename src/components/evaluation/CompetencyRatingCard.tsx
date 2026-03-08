import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./StarRating";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompetencyRatingCardProps {
  competencyId: string;
  competencyName: string;
  competencyDescription?: string;
  competencyType: 'hard_skill' | 'soft_skill';
  score: number | null;
  comment: string;
  onScoreChange: (score: number) => void;
  onCommentChange: (comment: string) => void;
  scaleLevels: 4 | 5;
  scaleLabels: string[];
  requireComment: boolean;
  disabled?: boolean;
}

export function CompetencyRatingCard({
  competencyName,
  competencyDescription,
  competencyType,
  score,
  comment,
  onScoreChange,
  onCommentChange,
  scaleLevels,
  scaleLabels,
  requireComment,
  disabled = false,
}: CompetencyRatingCardProps) {
  const isComplete = score !== null && (!requireComment || comment.trim().length > 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">{competencyName}</CardTitle>
            {competencyDescription && (
              <p className="text-sm text-muted-foreground mt-1">{competencyDescription}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {competencyType === 'soft_skill' ? 'Soft Skill' : 'Hard Skill'}
            </Badge>
            {isComplete && <Check className="size-4 text-primary" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div>
          <Label className="block text-sm font-medium mb-4">Sua avaliação</Label>
          <StarRating
            value={score}
            onChange={onScoreChange}
            levels={scaleLevels}
            labels={scaleLabels}
            disabled={disabled}
          />
        </div>

        {requireComment && (
          <div>
            <Label className="block text-sm font-medium mb-2">
              Comentário *
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder={`Adicione um comentário sobre ${competencyName.toLowerCase()}...`}
              className="min-h-[80px] resize-none"
              disabled={disabled}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
