import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Send, X, PlusCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const UploadPrescription: React.FC = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '' }]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: '' }]);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Prescription uploaded and patient notified.");
    navigate('/doctor');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">New Prescription</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
              <CardDescription>Enter medication and diagnosis for the patient</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Patient</Label>
                  <Select value={patient} onValueChange={setPatient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Patient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alice Johnson">Alice Johnson (Token #13)</SelectItem>
                      <SelectItem value="David Miller">David Miller (Token #14)</SelectItem>
                      <SelectItem value="Eve White">Eve White (Token #15)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Diagnosis Notes</Label>
                  <Textarea placeholder="Describe patient symptoms and diagnosis..." rows={4} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold">Medications</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addMedicine} className="gap-1 text-primary">
                    <PlusCircle className="w-4 h-4" /> Add More
                  </Button>
                </div>

                {medicines.map((med, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-xl relative group">
                    {medicines.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeMedicine(i)}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Medicine Name</Label>
                      <Input placeholder="Paracetamol" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Dosage</Label>
                      <Input placeholder="500mg - 1-0-1" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Duration</Label>
                      <Input placeholder="5 Days" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center text-muted-foreground hover:bg-muted/30 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Drag lab reports or scans here</p>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Save to Digital Locker</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Notify Patient via Email/App</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Update Health Timeline</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full gap-2 h-11" disabled={!patient}>
                <Send className="w-4 h-4" />
                Send Prescription
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default UploadPrescription;
