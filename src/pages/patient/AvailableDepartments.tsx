import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface DoctorSummary {
  id: string;
  name: string;
  degrees?: string | null;
}

interface DepartmentSummary {
  id: string;
  name: string;
  doctors: DoctorSummary[];
}

const AvailableDepartments: React.FC = () => {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDepartments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<DepartmentSummary[]>("/patient/departments");
        if (!cancelled) {
          setDepartments(response.data);
        }
      } catch {
        if (!cancelled) {
          setDepartments([]);
          setError("Unable to load departments");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDepartments();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasDepartments = departments.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {t("available_departments")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse all departments and their available doctors, including their qualifications.
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">
          Loading departments
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && !hasDepartments && (
        <p className="text-sm text-muted-foreground">
          No departments are currently available.
        </p>
      )}

      {hasDepartments && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((department) => {
            const doctorCount = department.doctors.length;

            return (
              <Card key={department.id} className="medical-card h-full flex flex-col">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {department.name}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {doctorCount === 1 ? "1 doctor" : `${doctorCount} doctors`}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  {doctorCount === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No approved doctors are currently available in this department.
                    </p>
                  )}
                  {department.doctors.map((doctor) => {
                    const hasDegrees = typeof doctor.degrees === "string" && doctor.degrees.trim().length > 0;
                    return (
                      <div
                        key={doctor.id}
                        className="rounded-lg bg-muted/40 px-3 py-2 border border-transparent hover:border-primary/30 transition-colors"
                      >
                        <p className="text-xs font-semibold text-foreground">
                          {doctor.name}
                        </p>
                        {hasDegrees && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {doctor.degrees}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailableDepartments;

