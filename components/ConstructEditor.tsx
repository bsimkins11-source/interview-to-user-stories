'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Copy, Download, Upload, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from './ui/use-toast';

// Simplified interface without Zod
interface ConstructFormData {
  name: string;
  description?: string;
  output_schema: string[];
  pattern: string;
  defaults: Record<string, string>;
  priority_rules: string[];
}

// Default construct template
const defaultConstruct: ConstructFormData = {
  name: "Default User Story Template",
  description: "Standard user story format for interview transcripts",
  output_schema: [
    "User Story ID",
    "User Story", 
    "Team",
    "Category",
    "Lifecycle Phase",
    "Capability",
    "Priority",
    "Source",
    "Snippet",
    "Match Score",
    "Tags"
  ],
  pattern: "As a {{role}}, I need {{capability}} so that {{benefit}}.",
  defaults: {
    "Category": "Workflow",
    "Lifecycle Phase": "Execution",
    "Team": "Product",
    "Priority": "Medium"
  },
  priority_rules: ["top|high", "medium", "low"]
};

// Pre-built construct templates
const constructTemplates = {
  "User Story": {
    name: "User Story Template",
    description: "Classic user story format",
    output_schema: ["ID", "Story", "Role", "Feature", "Benefit", "Priority", "Source"],
    pattern: "As a {{role}}, I want {{feature}} so that {{benefit}}.",
    defaults: { "Priority": "Medium" },
    priority_rules: ["high", "medium", "low"]
  },
  "Feature Request": {
    name: "Feature Request Template",
    description: "Structured feature requirements",
    output_schema: ["ID", "Feature", "Description", "Business Value", "Effort", "Priority", "Source"],
    pattern: "The system should {{feature}} to enable {{business_value}}.",
    defaults: { "Effort": "Medium", "Priority": "Medium" },
    priority_rules: ["critical", "high", "medium", "low"]
  },
  "Process Improvement": {
    name: "Process Improvement Template",
    description: "Workflow and process enhancements",
    output_schema: ["ID", "Process", "Current State", "Desired State", "Impact", "Priority", "Source"],
    pattern: "Improve {{process}} from {{current_state}} to {{desired_state}}.",
    defaults: { "Impact": "Medium", "Priority": "Medium" },
    priority_rules: ["high", "medium", "low"]
  }
};

interface ConstructEditorProps {
  onSave: (construct: ConstructFormData) => void;
  initialData?: ConstructFormData;
}

export function ConstructEditor({ onSave, initialData }: ConstructEditorProps) {
  const [activeTab, setActiveTab] = useState("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [outputSchema, setOutputSchema] = useState<string[]>(
    initialData?.output_schema || defaultConstruct.output_schema
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset
  } = useForm<Omit<ConstructFormData, 'output_schema'>>({
    defaultValues: {
      name: initialData?.name || defaultConstruct.name,
      description: initialData?.description || defaultConstruct.description,
      pattern: initialData?.pattern || defaultConstruct.pattern,
      defaults: initialData?.defaults || defaultConstruct.defaults,
      priority_rules: initialData?.priority_rules || defaultConstruct.priority_rules
    },
    mode: "onChange"
  });

  const watchedDefaults = watch("defaults");

  const addOutputField = () => {
    setOutputSchema(prev => [...prev, `Field ${prev.length + 1}`]);
  };

  const removeOutputField = (index: number) => {
    setOutputSchema(prev => prev.filter((_, i) => i !== index));
  };

  const updateOutputField = (index: number, value: string) => {
    setOutputSchema(prev => prev.map((field, i) => i === index ? value : field));
  };

  const handleTemplateSelect = (templateKey: string) => {
    const template = constructTemplates[templateKey as keyof typeof constructTemplates];
    if (template) {
      reset(template);
      setOutputSchema(template.output_schema);
      toast({
        title: "Template loaded",
        description: `${template.name} has been applied to your construct.`,
      });
    }
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          reset(jsonData);
          setOutputSchema(jsonData.output_schema || []);
          toast({
            title: "Import successful",
            description: "Construct has been imported from JSON file.",
          });
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Invalid JSON file. Please check the format.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportJSON = () => {
    const formData = watch();
    const fullData: ConstructFormData = {
      ...formData,
      output_schema: outputSchema
    };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fullData.name.replace(/\s+/g, '_')}_construct.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onSubmit = async (data: Omit<ConstructFormData, 'output_schema'>) => {
    setIsLoading(true);
    try {
      const fullData: ConstructFormData = {
        ...data,
        output_schema: outputSchema
      };
      await onSave(fullData);
      toast({
        title: "Construct saved",
        description: "Your construct template has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your construct.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addDefaultField = () => {
    const key = prompt("Enter default field name:");
    if (key && !watchedDefaults[key]) {
      const value = prompt(`Enter default value for "${key}":`);
      if (value !== null) {
        setValue(`defaults.${key}`, value);
      }
    }
  };

  const removeDefaultField = (key: string) => {
    const newDefaults = { ...watchedDefaults };
    delete newDefaults[key];
    setValue("defaults", newDefaults);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor">Construct Editor</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Define Your Output Structure</CardTitle>
              <CardDescription>
                Configure how interview transcripts will be transformed into structured data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Construct Name *</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g., User Story Template"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      {...register("description")}
                      placeholder="Brief description of this template"
                    />
                  </div>
                </div>

                {/* Output Schema */}
                <div>
                  <Label>Output Columns *</Label>
                  <div className="space-y-2 mt-2">
                    {outputSchema.map((field, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={field}
                          onChange={(e) => updateOutputField(index, e.target.value)}
                          placeholder="Column name"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOutputField(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOutputField}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Output Column
                    </Button>
                  </div>
                </div>

                {/* Pattern Template */}
                <div>
                  <Label htmlFor="pattern">Pattern Template *</Label>
                  <Textarea
                    id="pattern"
                    {...register("pattern")}
                    placeholder="e.g., As a {{role}}, I need {{capability}} so that {{benefit}}."
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use {'{'}variable{'}'} syntax to define extractable fields
                  </p>
                  {errors.pattern && (
                    <p className="text-sm text-red-500 mt-1">{errors.pattern.message}</p>
                  )}
                </div>

                {/* Default Values */}
                <div>
                  <Label>Default Values</Label>
                  <div className="space-y-2 mt-2">
                    {Object.entries(watchedDefaults).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <Input
                          value={key}
                          disabled
                          className="bg-gray-50"
                        />
                        <Input
                          value={value}
                          onChange={(e) => setValue(`defaults.${key}`, e.target.value)}
                          placeholder="Default value"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDefaultField(key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addDefaultField}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Default Field
                    </Button>
                  </div>
                </div>

                {/* Priority Rules */}
                <div>
                  <Label>Priority Classification Rules</Label>
                  <div className="space-y-2 mt-2">
                    {watch("priority_rules").map((rule, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={rule}
                          onChange={(e) => {
                            const newRules = [...watch("priority_rules")];
                            newRules[index] = e.target.value;
                            setValue("priority_rules", newRules);
                          }}
                          placeholder="e.g., top|high"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newRules = watch("priority_rules").filter((_, i) => i !== index);
                            setValue("priority_rules", newRules);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newRules = [...watch("priority_rules"), ""];
                        setValue("priority_rules", newRules);
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Priority Rule
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={!isValid || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Saving..." : "Save Construct"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reset(defaultConstruct)}
                  >
                    Reset to Default
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pre-built Templates</CardTitle>
              <CardDescription>
                Choose from pre-built construct templates or import your own
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(constructTemplates).map(([key, template]) => (
                  <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTemplateSelect(key)}
                        className="w-full"
                      >
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="import-json">Import JSON</Label>
                  <Input
                    id="import-json"
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Export JSON</Label>
                  <Button
                    variant="outline"
                    onClick={handleExportJSON}
                    className="w-full mt-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Construct
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Output Preview</CardTitle>
              <CardDescription>
                See how your construct will structure the interview data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">CSV Headers</h4>
                  <div className="bg-gray-50 p-3 rounded border">
                    {outputSchema.join(" | ")}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Pattern Template</h4>
                  <div className="bg-gray-50 p-3 rounded border font-mono">
                    {watch("pattern")}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Default Values</h4>
                  <div className="bg-gray-50 p-3 rounded border">
                    {Object.entries(watchedDefaults).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Sample Output Row</h4>
                  <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                    {outputSchema.map((header, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{header}:</span>
                        <span className="text-gray-500">
                          {watchedDefaults[header] || "{{extracted_value}}" || "..."}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
