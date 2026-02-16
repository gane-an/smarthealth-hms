import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const FeedbackPage: React.FC = () => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please provide a star rating");
      return;
    }
    setSubmitted(true);
    toast.success("Thank you for your feedback!");
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <div className="p-4 bg-green-100 rounded-full">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Feedback Submitted!</h1>
        <p className="text-muted-foreground max-w-md">
          Your input helps us improve HealSync. We appreciate your time and effort in sharing your experience.
        </p>
        <Button onClick={() => setSubmitted(false)}>Submit Another Review</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="medical-card border-none shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('feedback')}</CardTitle>
          <CardDescription>How was your experience with our services today?</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8 py-6">
            <div className="flex flex-col items-center gap-4">
              <Label className="text-lg font-medium">Rate your experience</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-10 h-10 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground opacity-30'}`} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm font-bold text-primary">
                {rating === 1 && "Very Dissatisfied"}
                {rating === 2 && "Dissatisfied"}
                {rating === 3 && "Neutral"}
                {rating === 4 && "Satisfied"}
                {rating === 5 && "Very Satisfied"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Tell us more (Optional)</Label>
              <Textarea 
                id="comment" 
                placeholder="What could we do better?" 
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full gap-2 h-11">
              <Send className="w-4 h-4" />
              Submit Feedback
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default FeedbackPage;
