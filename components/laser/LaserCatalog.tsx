"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA, type LaserService } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LaserCatalogProps = {
  variant?: "site" | "app";
};

export function LaserCatalog({ variant = "site" }: LaserCatalogProps) {
  const app = variant === "app";
  const phone = PASTEUR_DATA.institute.phoneDigits;
  const [services, setServices] = useState<LaserService[]>([]);

  useEffect(() => {
    PasteurStorage.initLaserServicesIfNeeded();
    setServices(
      PasteurStorage.getLaserServices().filter((service) => service.active !== false),
    );
  }, []);

  const grid = useMemo(
    () => (
      <div className={cn(app ? "space-y-3" : "grid grid-cols-1 gap-5 sm:grid-cols-2")}>
        {services.map((service) => (
          <Card
            key={service.id}
            className={cn(
              "hover:border-purple-400",
              app ? "p-4" : "p-6",
              app && "space-y-0",
            )}
          >
            <span className={cn("text-3xl", app && "text-2xl")}>{service.emoji}</span>
            <h2 className={cn("mt-3 text-lg font-bold", app && "mt-2 text-sm")}>
              {service.title}
            </h2>
            {service.description ? (
              <p className={cn("mt-2 text-sm text-slate-600", app && "mt-1 text-xs leading-6")}>
                {service.description}
              </p>
            ) : null}
            <p
              className={cn(
                "mt-2 font-semibold text-purple-700",
                app && "mt-1 text-sm",
              )}
            >
              {service.price}
            </p>
          </Card>
        ))}
      </div>
    ),
    [app, services],
  );

  if (app) {
    return (
      <>
        {grid}
        <Card hover={false} className="mt-4 border-purple-200 bg-purple-50 p-4 text-center">
          <p className="mb-3 text-sm text-slate-700">برای مشاوره و رزرو تماس بگیرید</p>
          <Button href={`tel:${phone}`} variant="accent" className="w-full">
            تماس برای رزرو
          </Button>
          <Link
            href={`${ROUTES.app.consultation}?category=laser&type=video`}
            className="mt-3 block text-center text-sm font-bold text-cyan-700 underline-offset-4 hover:underline"
          >
            ثبت درخواست مشاوره آنلاین
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      {grid}
      <Card hover={false} className="mt-8 border-purple-200 bg-purple-50 p-6 text-center">
        <p className="mb-4 text-slate-700">برای مشاوره رایگان و رزرو نوبت تماس بگیرید</p>
        <Button href={`tel:${phone}`} variant="accent">
          رزرو مشاوره
        </Button>
      </Card>
    </>
  );
}
