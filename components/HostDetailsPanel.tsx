import React, { useEffect, useMemo, useState } from "react";
import { Host, SSHKey } from "../types";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { Network, KeyRound, Lock, Share2, Server, Shield, Zap, TerminalSquare, Tag, ChevronLeft, Navigation, PhoneCall } from "lucide-react";

type Protocol = "ssh" | "telnet";
type AuthMethod = "password" | "key" | "certificate" | "fido2";

interface HostDetailsPanelProps {
  initialData?: Host | null;
  availableKeys: SSHKey[];
  groups: string[];
  onSave: (host: Host) => void;
  onCancel: () => void;
}

const HostDetailsPanel: React.FC<HostDetailsPanelProps> = ({
  initialData,
  availableKeys,
  groups,
  onSave,
  onCancel
}) => {
  const [form, setForm] = useState<Host>(() => initialData || ({
    id: crypto.randomUUID(),
    label: "",
    hostname: "",
    port: 22,
    username: "root",
    protocol: "ssh",
    tags: [],
    os: "linux",
    agentForwarding: false,
    authMethod: "password",
    charset: "UTF-8",
    theme: "Flexoki Dark"
  } as Host));

  const tagsInput = useMemo(() => form.tags?.join(", "), [form.tags]);

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  const update = <K extends keyof Host>(key: K, value: Host[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!form.hostname || !form.label) return;
    const cleaned: Host = {
      ...form,
      tags: form.tags || [],
      port: form.port || 22,
    };
    onSave(cleaned);
  };

  const setTelnetDefaults = () => {
    setForm((prev) => ({
      ...prev,
      protocol: "telnet",
      port: prev.port || 23,
      authMethod: "password",
      identityFileId: "",
    }));
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[380px] border-l border-border/60 bg-secondary/90 backdrop-blur z-30 overflow-y-auto">
      <div className="p-4 flex items-center justify-between border-b border-border/60">
        <div>
          <p className="text-sm font-semibold">{initialData ? "Edit Host" : "New Host"}</p>
          <p className="text-xs text-muted-foreground">Personal vault</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel} aria-label="Close">
          <ChevronLeft size={16} />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-3 space-y-2 bg-card border-border/80">
          <p className="text-xs font-semibold">Address</p>
          <Input
            placeholder="IP or Hostname"
            value={form.hostname}
            onChange={(e) => update("hostname", e.target.value)}
            className="h-10"
          />
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-secondary/70 border border-border/70 rounded-md px-2 py-1 w-full">
              <span className="text-xs text-muted-foreground">SSH on</span>
              <Input
                type="number"
                value={form.port}
                onChange={(e) => update("port", Number(e.target.value))}
                className="h-8 w-16 text-center"
              />
              <span className="text-xs text-muted-foreground">port</span>
            </div>
            <Button
              variant={form.protocol === "ssh" ? "secondary" : "ghost"}
              className="h-10 flex-1"
              onClick={() => update("protocol", "ssh")}
            >
              SSH
            </Button>
            <Button
              variant={form.protocol === "telnet" ? "secondary" : "ghost"}
              className="h-10 flex-1"
              onClick={() => { update("protocol", "telnet"); update("port", 23); }}
            >
              Telnet
            </Button>
          </div>
        </Card>

        <Card className="p-3 space-y-2 bg-card border-border/80">
          <p className="text-xs font-semibold">General</p>
          <Input placeholder="Label" value={form.label} onChange={(e) => update("label", e.target.value)} className="h-10" />
          <Input placeholder="Parent Group" value={form.group || ""} onChange={(e) => update("group", e.target.value)} list="group-options" className="h-10" />
          <datalist id="group-options">
            {groups.map((g) => <option key={g} value={g} />)}
          </datalist>
          <Input
            placeholder="Tags (comma separated)"
            value={tagsInput}
            onChange={(e) => update("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
            className="h-10"
          />
        </Card>

        <Card className="p-3 space-y-3 bg-card border-border/80">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Credentials</p>
            <Badge variant="secondary" className="gap-1 text-xs"><Network size={12} /> {form.protocol?.toUpperCase() || "SSH"}</Badge>
          </div>
          <div className="grid gap-2">
            <Input placeholder="Username" value={form.username} onChange={(e) => update("username", e.target.value)} className="h-10" />
            {form.authMethod !== "key" && (
              <Input placeholder="Password" type="password" value={form.password || ""} onChange={(e) => update("password", e.target.value)} className="h-10" />
            )}
            <div className="flex gap-2">
              {(["password", "key", "certificate", "fido2"] as AuthMethod[]).map((m) => (
                <Button
                  key={m}
                  variant={form.authMethod === m ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("flex-1 capitalize", form.authMethod === m && "bg-primary/15")}
                  onClick={() => update("authMethod", m)}
                >
                  {m}
                </Button>
              ))}
            </div>
            {form.authMethod === "key" && (
              <select
                value={form.identityFileId || ""}
                onChange={(e) => update("identityFileId", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select key</option>
                {availableKeys.map((k) => (
                  <option key={k.id} value={k.id}>{k.label}</option>
                ))}
              </select>
            )}
          </div>
        </Card>

        <Card className="p-3 space-y-2 bg-card border-border/80">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Extras</p>
            <Badge variant="secondary" className="gap-1 text-xs"><Shield size={12} /> Secure</Badge>
          </div>
          <div className="grid gap-2">
            <ToggleRow
              label="Agent Forwarding"
              enabled={!!form.agentForwarding}
              onToggle={() => update("agentForwarding", !form.agentForwarding)}
            />
            <Input placeholder="Startup Command" value={form.startupCommand || ""} onChange={(e) => update("startupCommand", e.target.value)} className="h-10" />
            <Input placeholder="Host Chaining" value={form.hostChaining || ""} onChange={(e) => update("hostChaining", e.target.value)} className="h-10" />
            <Input placeholder="Proxy" value={form.proxy || ""} onChange={(e) => update("proxy", e.target.value)} className="h-10" />
            <Input placeholder="Environment Variables" value={form.envVars || ""} onChange={(e) => update("envVars", e.target.value)} className="h-10" />
            <Input placeholder="Charset (e.g., UTF-8)" value={form.charset || ""} onChange={(e) => update("charset", e.target.value)} className="h-10" />
            <ToggleRow
              label="Mosh"
              enabled={!!form.moshEnabled}
              onToggle={() => update("moshEnabled", !form.moshEnabled)}
            />
          </div>
        </Card>

        <Card className="p-3 space-y-2 bg-card border-border/80">
          <p className="text-xs font-semibold">Theme</p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-16 rounded-md border border-border/60 bg-gradient-to-r from-gray-900 to-gray-700" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">{form.theme || "Flexoki Dark"}</p>
              <p className="text-[11px] text-muted-foreground">Terminal appearance</p>
            </div>
          </div>
          <Button variant="secondary" className="h-9 w-full">Select theme</Button>
        </Card>

        {form.protocol === "telnet" && (
          <Card className="p-3 space-y-3 bg-card border-border/80">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Network size={14} /> Telnet
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Telnet on</span>
              <Input
                type="number"
                value={form.port}
                onChange={(e) => update("port", Number(e.target.value))}
                className="h-9 w-16 text-center"
              />
              <span className="text-xs text-muted-foreground">port</span>
            </div>
            <div className="grid gap-2">
              <Input placeholder="Username" value={form.username} onChange={(e) => update("username", e.target.value)} className="h-10" />
              <Input placeholder="Password" type="password" value={form.password || ""} onChange={(e) => update("password", e.target.value)} className="h-10" />
              <Input placeholder="Charset (e.g., UTF-8)" value={form.charset || ""} onChange={(e) => update("charset", e.target.value)} className="h-10" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-16 rounded-md border border-border/60 bg-gradient-to-r from-gray-900 to-gray-700" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">{form.theme || "Flexoki Dark"}</p>
                <p className="text-[11px] text-muted-foreground">Telnet appearance</p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1 h-10" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1 h-10" onClick={handleSubmit} disabled={!form.hostname || !form.label}>
            Save &amp; Connect
          </Button>
        </div>

        <Button variant="ghost" className="w-full h-10 gap-2" onClick={setTelnetDefaults}>
          <PhoneCall size={16} /> Add Telnet
        </Button>
      </div>
    </div>
  );
};

interface ToggleRowProps {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, enabled, onToggle }) => (
  <div className="flex items-center justify-between h-10 px-3 rounded-md border border-border/70 bg-secondary/70">
    <span className="text-sm">{label}</span>
    <Button variant={enabled ? "secondary" : "ghost"} size="sm" className={cn("h-8 min-w-[72px]", enabled && "bg-primary/20")} onClick={onToggle}>
      {enabled ? "Enabled" : "Disabled"}
    </Button>
  </div>
);

export default HostDetailsPanel;
