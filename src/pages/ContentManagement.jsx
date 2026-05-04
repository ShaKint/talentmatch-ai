import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Briefcase } from 'lucide-react';
import OrgContentTab from '@/components/content/OrgContentTab';
import JobContentTab from '@/components/content/JobContentTab';

export default function ContentManagement() {
  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">ניהול תוכן RAG</h1>
        <p className="text-muted-foreground mt-1 text-sm">ניהול תוכן לסוכני ה-AI — כלל-ארגוני ולפי משרה</p>
      </div>

      <Tabs defaultValue="organization" dir="rtl">
        <TabsList className="mb-6">
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="w-4 h-4" />
            תוכן ארגוני
          </TabsTrigger>
          <TabsTrigger value="job" className="gap-2">
            <Briefcase className="w-4 h-4" />
            תוכן לפי משרה
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <OrgContentTab />
        </TabsContent>

        <TabsContent value="job">
          <JobContentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}