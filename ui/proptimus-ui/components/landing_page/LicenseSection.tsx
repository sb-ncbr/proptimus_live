import React from "react";
import { Card } from "../ui/card";
import { Scale, Shield, FileText } from "lucide-react";

export default function LicenseSection(): React.JSX.Element {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="lg:text-4xl font-bold text-center text-gray-900 mb-8">
          License
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 m-2 transition hover:shadow-lg transition-shadow duration-200 ease-out">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold text-gray-900">Legal Framework</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Licence conditions in accordance with § 11 of Act No. 130/2002 Coll. The owner of the software is Masaryk University, a public university, ID: 00216224.
            </p>
          </Card>

          <Card className="p-6 m-2 transition hover:shadow-lg transition-shadow duration-200 ease-out">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold text-gray-900">Usage Rights</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Masaryk University allows other companies and individuals to use this software free of charge and without territorial restrictions in usual way, that does not depreciate its value. This permission is granted for the duration of property rights.
            </p>
          </Card>

          <Card className="p-6 m-2 transition hover:shadow-lg transition-shadow duration-200 ease-out">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold text-gray-900">Terms & Conditions</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              This software is not subject to special information treatment according to Act No. 412/2005 Coll., as amended. In case that a person who will use the software under this licence offer violates the licence terms, the permission to use the software terminates.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
