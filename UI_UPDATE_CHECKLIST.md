# UI Components Update Checklist

This document lists all UI components that need manual updates to work with the new database schema.

## Field Name Changes Reference

### User Fields
| Old Field Name | New Field Name | Type |
|----------------|----------------|------|
| `name` | `fullName` | string |
| `password` | `passwordHash` | string |
| `company_id` | `ordProjectId` | string (UUID) |
| `emailVerified` / `emailVerifiedBool` | `isEmailVerified` | boolean |
| `created_at` | `createdAt` | Date |
| `updatedAt` | `updatedAt` | Date (no change) |

### Call Log Fields
| Old Field Name | New Field Name | Type | Notes |
|----------------|----------------|------|-------|
| `call_id` | `id` | string | - |
| `agent_name` | `agentName` | string | From joined agent |
| `start_timestamp` | `startTime` | Date | - |
| `end_timestamp` | `endTime` | Date | - |
| `duration_ms` | `durationSeconds` | number | Changed from ms to seconds |
| `call_status` | `status` | string | - |
| `from_number` | `callerPhone` | string | - |
| `to_number` | `agentPhone` | string | - |
| `disconnection_reason` | `disconnectReason` | string | - |

### Removed Fields (No replacement)
- `sentiment_status` - Removed
- `sentiment_score` - Removed
- `batch_reference` - Removed
- `batch_job_id` - Removed
- `livekit_participant_id` - Removed

## Components to Update

### 1. User Management Components

#### `src/components/user/UsersTable.tsx`
**Status:** ⚠️ Needs Update

**Current Usage:**
```typescript
// Old code
<TableCell>{user.name}</TableCell>
<TableCell>{user.emailVerified ? 'Verified' : 'Not Verified'}</TableCell>
<TableCell>{formatDate(user.created_at)}</TableCell>
```

**Update To:**
```typescript
// New code
<TableCell>{user.fullName}</TableCell>
<TableCell>{user.isEmailVerified ? 'Verified' : 'Not Verified'}</TableCell>
<TableCell>
  <Badge variant={user.mfaEnabled ? 'success' : 'secondary'}>
    {user.mfaEnabled ? 'Enabled' : 'Disabled'}
  </Badge>
</TableCell>
<TableCell>{formatDate(user.createdAt)}</TableCell>
```

**New Fields to Display:**
- `user.mfaEnabled` - MFA status
- `user.isActive` - Account active status
- `user.ordProjectId` - Project assignment

---

#### `src/components/user/UserEditForm.tsx`
**Status:** ⚠️ Needs Update

**Current Fields:**
```typescript
const formSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  // ...
});
```

**Update To:**
```typescript
const formSchema = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email(),
  username: z.string().optional(),
  bio: z.string().optional(),
  ordProjectId: z.string().uuid().optional(),
  // ...
});
```

**Form Field Updates:**
```tsx
{/* Old */}
<Input name="name" label="Name" {...form.register('name')} />

{/* New */}
<Input name="fullName" label="Full Name" {...form.register('fullName')} />
```

---

#### `src/components/user/UserManagementTable.tsx`
**Status:** ⚠️ Needs Update

**Update Table Columns:**
```typescript
const columns = [
  {
    accessorKey: 'fullName',  // Changed from 'name'
    header: 'Full Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'isEmailVerified',  // Changed from 'emailVerified'
    header: 'Email Verified',
    cell: ({ row }) => row.original.isEmailVerified ? 'Yes' : 'No',
  },
  {
    accessorKey: 'mfaEnabled',  // New column
    header: 'MFA',
    cell: ({ row }) => row.original.mfaEnabled ? 'Enabled' : 'Disabled',
  },
  {
    accessorKey: 'isActive',  // New column
    header: 'Status',
    cell: ({ row }) => row.original.isActive ? 'Active' : 'Inactive',
  },
  {
    accessorKey: 'createdAt',  // Changed from 'created_at'
    header: 'Created',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];
```

---

### 2. Dashboard Components

#### `src/components/dashboard/CallsTable.tsx`
**Status:** ⚠️ Needs Update

**Update Call Display:**
```typescript
// Old
<TableCell>{call.call_id}</TableCell>
<TableCell>{call.from_number}</TableCell>
<TableCell>{call.to_number}</TableCell>
<TableCell>{formatDuration(call.duration_ms)}</TableCell>
<TableCell>{formatTimestamp(call.start_timestamp)}</TableCell>

// New
<TableCell>{call.id}</TableCell>
<TableCell>{call.callerPhone}</TableCell>
<TableCell>{call.agentPhone}</TableCell>
<TableCell>{formatDuration(call.durationSeconds * 1000)}</TableCell> {/* Convert back to ms */}
<TableCell>{formatDate(call.startTime)}</TableCell>
<TableCell>
  <Badge variant={getStatusVariant(call.status)}>
    {call.status}
  </Badge>
</TableCell>
<TableCell>{call.disposition Code || '-'}</TableCell>
```

**Remove Sentiment Display:**
```typescript
// Remove these (no longer available)
// <TableCell>{call.sentiment_status}</TableCell>
// <TableCell>{call.sentiment_score}</TableCell>
```

---

#### `src/components/dashboard/CallsStats.tsx`
**Status:** ⚠️ Needs Update

**Update Stats Calculation:**
```typescript
// Old
const stats = {
  totalCalls: calls.length,
  totalDuration: calls.reduce((sum, call) => sum + (call.duration_ms || 0), 0),
  endedCalls: calls.filter(c => c.call_status === 'ended').length,
};

// New
const stats = {
  totalCalls: calls.length,
  totalDuration: calls.reduce((sum, call) => sum + (call.durationSeconds || 0) * 1000, 0),
  completedCalls: calls.filter(c => c.status === 'completed').length,
  inboundCalls: calls.filter(c => c.direction === 'inbound').length,
  outboundCalls: calls.filter(c => c.direction === 'outbound').length,
};
```

**Remove Sentiment Stats:**
```typescript
// Remove these calculations
// const greenSentiment = calls.filter(c => c.sentiment_status === 'GREEN').length;
// const amberSentiment = calls.filter(c => c.sentiment_status === 'AMBER').length;
// const redSentiment = calls.filter(c => c.sentiment_status === 'RED').length;
```

---

#### `src/components/dashboard/CallsChart.tsx`
**Status:** ⚠️ Needs Update

**Update Data Mapping:**
```typescript
// Old
const data = calls.map(call => ({
  date: new Date(call.start_timestamp),
  duration: call.duration_ms,
  status: call.call_status,
}));

// New
const data = calls.map(call => ({
  date: new Date(call.startTime),
  duration: call.durationSeconds * 1000, // Convert to ms for display
  status: call.status,
  direction: call.direction,
}));
```

**Remove Sentiment Charts:**
```typescript
// Remove sentiment-based charts
// const sentimentData = groupBySentiment(calls);
```

---

### 3. Form Components

#### `src/components/form/RegisterForm.tsx`
**Status:** ⚠️ Needs Update

**Update Form Schema:**
```typescript
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),  // Changed from 'name'
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  username: z.string().min(3).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

**Update Form Submission:**
```typescript
const onSubmit = async (data) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: data.fullName,  // Changed from 'name'
        email: data.email,
        password: data.password,
        username: data.username,
      }),
    });
    // ...
  } catch (error) {
    // ...
  }
};
```

---

#### `src/components/form/ProfileForm.tsx`
**Status:** ⚠️ Needs Update

**Update Fields:**
```tsx
{/* Old */}
<Input label="Name" {...form.register('name')} />

{/* New */}
<Input label="Full Name" {...form.register('fullName')} />

{/* Add new fields */}
<Input
  label="Project ID"
  {...form.register('ordProjectId')}
  disabled
  readOnly
/>

<div className="flex items-center gap-2">
  <Badge variant={user.mfaEnabled ? 'success' : 'secondary'}>
    MFA: {user.mfaEnabled ? 'Enabled' : 'Disabled'}
  </Badge>
  {!user.mfaEnabled && (
    <Button onClick={() => router.push('/settings/mfa')}>
      Enable MFA
    </Button>
  )}
</div>
```

---

### 4. Agent Components

#### `src/components/agent/AgentsTable.tsx`
**Status:** ⚠️ Needs Update

**Remove Columns:**
```typescript
// Remove these columns (data moved to separate tables)
// phone_provider
// phone_provider_sid
// greeting_message
// end_call_phrases
```

**Add Phone Number Lookup:**
```typescript
// Instead of showing provider fields, show phone assignment
const AgentRow = ({ agent }) => {
  const { data: phoneNumber } = useSWR(
    agent.phoneNumber ? `/api/phone-numbers?number=${agent.phoneNumber}` : null
  );

  return (
    <TableRow>
      <TableCell>{agent.name}</TableCell>
      <TableCell>{agent.phoneNumber || 'Not Assigned'}</TableCell>
      <TableCell>
        {phoneNumber ? (
          <div>
            <div>{phoneNumber.provider}</div>
            <div className="text-xs text-muted-foreground">
              {phoneNumber.friendlyName}
            </div>
          </div>
        ) : '-'}
      </TableCell>
      {/* ... */}
    </TableRow>
  );
};
```

---

### 5. Profile Components

#### `src/components/profile/[username]/page.tsx`
**Status:** ⚠️ Needs Update

**Update User Display:**
```tsx
// Old
<h1>{user.name}</h1>
<p>Joined {formatDate(user.created_at)}</p>

// New
<h1>{user.fullName}</h1>
<p className="text-sm text-muted-foreground">@{user.username}</p>
<p>Joined {formatDate(user.createdAt)}</p>
<div className="flex gap-2 mt-2">
  {user.isEmailVerified && (
    <Badge variant="success">Email Verified</Badge>
  )}
  {user.mfaEnabled && (
    <Badge variant="info">MFA Enabled</Badge>
  )}
  {!user.isActive && (
    <Badge variant="destructive">Inactive</Badge>
  )}
</div>
```

---

## New Components to Create

### 1. Phone Number Management
**File:** `src/components/admin/PhoneNumbersTable.tsx`

```typescript
interface PhoneNumbersTableProps {
  numbers: PhoneNumber[];
}

export function PhoneNumbersTable({ numbers }: PhoneNumbersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Phone Number</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Trunk ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {numbers.map((number) => (
          <TableRow key={number.id}>
            <TableCell>{number.phoneNumber}</TableCell>
            <TableCell>{number.provider}</TableCell>
            <TableCell>{number.trunkId || '-'}</TableCell>
            <TableCell>
              <Badge variant={number.isAvailable ? 'success' : 'secondary'}>
                {number.isAvailable ? 'Available' : 'Assigned'}
              </Badge>
            </TableCell>
            <TableCell>{number.assignedToAgentId || 'Unassigned'}</TableCell>
            <TableCell>
              <Button size="sm">Edit</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 2. Agent Prompts Management
**File:** `src/components/admin/AgentPromptsEditor.tsx`

```typescript
interface AgentPromptsEditorProps {
  agentId: string;
}

export function AgentPromptsEditor({ agentId }: AgentPromptsEditorProps) {
  const { data: prompts } = useSWR(`/api/agents/${agentId}/prompts`);

  return (
    <div className="space-y-4">
      <h3>Agent Prompts</h3>
      <Textarea
        label="Greeting Message"
        value={prompts?.greetingMessage}
        onChange={(e) => updatePrompt({ greetingMessage: e.target.value })}
      />
      <Textarea
        label="System Instructions"
        value={prompts?.systemInstructions}
        rows={10}
      />
      <Input
        label="Silence Timeout (seconds)"
        type="number"
        value={prompts?.silenceTimeoutSeconds}
      />
      <Switch
        label="Enable Interruptions"
        checked={prompts?.enableInterruptions}
      />
    </div>
  );
}
```

---

## Testing Checklist

After updating components:

### User Management
- [ ] User list displays correctly with fullName
- [ ] Email verification status shows correctly
- [ ] MFA status badge appears
- [ ] User creation form works with new fields
- [ ] User editing saves fullName correctly
- [ ] User deletion performs soft delete

### Call Logs
- [ ] Call list displays with new field names
- [ ] Call duration calculates correctly (seconds → ms conversion)
- [ ] Call status badges show correctly
- [ ] Disposition codes display
- [ ] Removed fields don't cause errors

### Agents
- [ ] Agent list shows correctly without removed fields
- [ ] Phone number assignment displays
- [ ] Agent editing works without prompt fields

### Dashboard
- [ ] Stats calculate correctly
- [ ] Charts render with new data structure
- [ ] No errors about missing fields

### Forms
- [ ] Registration form submits with fullName
- [ ] Profile update works with new fields
- [ ] Password change functionality works

---

## Common Errors to Fix

### Error: "Cannot read property 'name' of undefined"
**Fix:** Change `user.name` to `user.fullName`

### Error: "emailVerified is not a function"
**Fix:** Change `user.emailVerified` to `user.isEmailVerified`

### Error: "created_at is undefined"
**Fix:** Change `user.created_at` to `user.createdAt`

### Error: "duration_ms is not defined"
**Fix:** Change `call.duration_ms` to `call.durationSeconds * 1000`

### Error: "sentiment_status does not exist"
**Fix:** Remove sentiment-related code, field no longer exists

---

## Quick Find & Replace

Use these regex patterns in your editor:

```regex
# User name field
user\.name\b → user.fullName

# Email verified
user\.emailVerified → user.isEmailVerified

# Created at
user\.created_at → user.createdAt

# Call duration (need manual review for conversion)
call\.duration_ms → call.durationSeconds

# Call phone numbers
call\.from_number → call.callerPhone
call\.to_number → call.agentPhone

# Call timestamps
call\.start_timestamp → call.startTime
call\.end_timestamp → call.endTime
```

**⚠️ Note:** Always review find & replace changes manually!

---

**Last Updated:** 2025-01-18
**Schema Version:** 1.0.0
