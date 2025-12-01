# Testing Upload Limits Implementation

## Test Plan

### 1. Database Migration Test
- [ ] Run the migration: `005_remove_daily_upload_constraint.sql`
- [ ] Verify the unique constraint is removed
- [ ] Test that multiple entries can be inserted for the same user/date

### 2. Backend API Test
- [ ] Test `getDailyUploadStatus()` for trial users (should show 0/1 or 1/1)
- [ ] Test `getDailyUploadStatus()` for paid users (should show X/4)
- [ ] Test `updateUserStats()` with multiple uploads for paid users
- [ ] Test `updateUserStats()` limit enforcement for trial users

### 3. Frontend UI Test
- [ ] Verify upload counter displays correctly
- [ ] Test upload limit reached message for trial users
- [ ] Test upload limit reached message for paid users (after 4 uploads)
- [ ] Verify upgrade messaging for trial users
- [ ] Test successful upload updates the counter

### 4. User Experience Test
- [ ] Trial user: Can upload 1 stat per day, sees upgrade message
- [ ] Paid user: Can upload 4 stats per day, no upgrade message
- [ ] Counter updates in real-time after uploads
- [ ] Error messages are clear and helpful

## Expected Behavior

### Trial Users
- Daily limit: 1 upload
- Counter shows: "0/1" → "1/1"
- After limit: "Daily Upload Limit Reached" + upgrade message

### Paid Users  
- Daily limit: 4 uploads
- Counter shows: "0/4" → "1/4" → "2/4" → "3/4" → "4/4"
- After limit: "Daily Upload Limit Reached" (no upgrade message)

## Database Schema Changes

```sql
-- Before: UNIQUE constraint prevents multiple uploads per day
UNIQUE(user_id, entry_date)

-- After: Constraint removed, limits enforced in application logic
-- Multiple entries per user per day are now allowed
```

## API Changes

### New Interface
```typescript
interface DailyUploadStatus {
  uploadsUsed: number;
  dailyLimit: number;
  canUpload: boolean;
  isPaidUser: boolean;
  userType: 'paid' | 'trial';
}
```

### New Endpoint
```typescript
dashboardService.getDailyUploadStatus(): Promise<{ data: DailyUploadStatus | null; error: any }>
```

### Updated Logic
- `updateUserStats()` now checks upload count vs. user-specific limits
- Error messages differentiate between user types
- Includes upgrade prompts for trial users
