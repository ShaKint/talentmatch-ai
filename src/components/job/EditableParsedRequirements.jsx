import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wand2, Filter, Plus, X, Pencil, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function WeightInputRow({ onAdd }) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    if (newLabel.trim()) {
      onAdd(newLabel.trim());
      setNewLabel('');
      setAdding(false);
    }
  };

  return adding ? (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        placeholder="שם הקטגוריה (eg. mobile_development)"
        value={newLabel}
        onChange={e => setNewLabel(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewLabel(''); } }}
        className="h-8 text-xs flex-1"
      />
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleAdd}><Check className="w-3.5 h-3.5 text-green-600" /></Button>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setAdding(false); setNewLabel(''); }}><X className="w-3.5 h-3.5 text-slate-400" /></Button>
    </div>
  ) : (
    <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-600 transition-colors">
      <Plus className="w-3 h-3" /> הוסף קטגוריה
    </button>
  );
}

function TagList({ items = [], color, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState('');

  const handleAdd = () => {
    if (newVal.trim()) {
      onAdd(newVal.trim());
      setNewVal('');
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {items.map((s, i) => (
        <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full ${color}`}>
          {s}
          <button onClick={() => onRemove(i)} className="hover:opacity-70 ml-0.5">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            value={newVal}
            onChange={e => setNewVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            className="h-7 text-xs w-36 rounded-full px-3"
          />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleAdd}><Check className="w-3.5 h-3.5 text-green-600" /></Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setAdding(false)}><X className="w-3.5 h-3.5 text-slate-400" /></Button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-600 transition-colors">
          <Plus className="w-3 h-3" /> הוסף
        </button>
      )}
    </div>
  );
}

function WeightRow({ label, value, onChange, onRemove, isEditable = true }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const handleSave = () => {
    const num = Math.min(100, Math.max(0, parseInt(val) || 0));
    onChange(num);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="capitalize text-sm text-slate-700 flex-1">{label.replace(/_/g, ' ')}</span>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <Input
              autoFocus
              type="number"
              min={0} max={100}
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
              className="h-7 w-16 text-xs text-center"
            />
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave}><Check className="w-3.5 h-3.5 text-green-600" /></Button>
          </>
        ) : (
          <>
            <span className="font-semibold text-sm w-10 text-right">{value}%</span>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setVal(value); setEditing(true); }}>
              <Pencil className="w-3.5 h-3.5 text-slate-400" />
            </Button>
          </>
        )}
        {isEditable && onRemove && (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onRemove}>
            <X className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function EditableParsedRequirements({ job, jobId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const parsed = job?.parsed_data || {};

  const save = async (updates) => {
    setSaving(true);
    await base44.entities.Job.update(jobId, {
      parsed_data: { ...parsed, ...updates }
    });
    queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    setSaving(false);
    toast({ title: 'נשמר' });
  };

  const updateList = (field, newList) => save({ [field]: newList });

  const addItem = (field, item) => {
    const list = [...(parsed[field] || []), item];
    updateList(field, list);
  };

  const removeItem = (field, idx) => {
    const list = (parsed[field] || []).filter((_, i) => i !== idx);
    updateList(field, list);
  };

  const updateWeight = (key, val) => {
    const weights = { ...(parsed.weights || {}), [key]: val };
    save({ weights });
  };

  const addWeight = (newLabel) => {
    if (!newLabel.trim()) return;
    const weights = { ...(parsed.weights || {}), [newLabel.trim()]: 0 };
    save({ weights });
  };

  const removeWeight = (key) => {
    const weights = { ...(parsed.weights || {}) };
    delete weights[key];
    save({ weights });
  };

  return (
    <>
      {/* Parsed Requirements */}
      <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2"><Wand2 className="h-5 w-5" /></div>
              <div>
                <CardTitle>Parsed Requirements</CardTitle>
                <CardDescription>לחץ על X להסרה, או + להוספה</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Must Have</p>
              <TagList
                items={parsed.must_have || []}
                color="bg-slate-900 text-white"
                onAdd={item => addItem('must_have', item)}
                onRemove={idx => removeItem('must_have', idx)}
              />
            </div>
            {(parsed.nice_to_have?.length > 0 || true) && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Nice to Have</p>
                <TagList
                  items={parsed.nice_to_have || []}
                  color="border border-slate-200 text-slate-700 bg-white"
                  onAdd={item => addItem('nice_to_have', item)}
                  onRemove={idx => removeItem('nice_to_have', idx)}
                />
              </div>
            )}
            {(parsed.alternative_titles?.length > 0 || true) && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Alternative Titles</p>
                <TagList
                  items={parsed.alternative_titles || []}
                  color="bg-blue-50 text-blue-700 border border-blue-200"
                  onAdd={item => addItem('alternative_titles', item)}
                  onRemove={idx => removeItem('alternative_titles', idx)}
                />
              </div>
            )}
            {parsed.search_keywords?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Sourcing Keywords</p>
                <TagList
                  items={parsed.search_keywords || []}
                  color="bg-purple-50 text-purple-700 border border-purple-200 font-mono"
                  onAdd={item => addItem('search_keywords', item)}
                  onRemove={idx => removeItem('search_keywords', idx)}
                />
              </div>
            )}
          </CardContent>
        </Card>

      {/* Fit Weights */}
      {parsed.weights && (
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2"><Filter className="h-5 w-5" /></div>
              <div>
                <CardTitle>Fit Weights</CardTitle>
                <CardDescription>ערוך משקלים, הוסף או הסר קטגוריות</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(parsed.weights).map(([key, value]) => (
              <WeightRow
                key={key}
                label={key}
                value={value}
                onChange={val => updateWeight(key, val)}
                onRemove={() => removeWeight(key)}
                isEditable={true}
              />
            ))}
            <WeightInputRow onAdd={addWeight} />
          </CardContent>
        </Card>
      )}
    </>
  );
}