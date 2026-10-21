# Bàn giao Backend → Frontend & Mobile

> Cập nhật: 21/10/2026 · Backend: `emergency-dispatch-backend` (chưa commit lên `main`, sẽ push sau)
> Tài liệu API đầy đủ: [`emergency-dispatch-backend/API_DOCUMENTATION.md`](emergency-dispatch-backend/API_DOCUMENTATION.md) · Swagger: `http://localhost:5000/swagger`

File này chỉ liệt kê những việc phía **Web (React)** và **Mobile (Expo)** cần làm vì thay đổi ở backend, hoặc lỗi backend phát hiện được khi đối chiếu. Backend không sửa trực tiếp code FE/Mobile.

| Mức | Ý nghĩa |
|---|---|
| 🔴 Bắt buộc | Không sửa sẽ hiển thị sai hoặc gọi API lỗi |
| 🟡 Nên làm | API backend đã sẵn sàng, FE/Mobile chưa tích hợp |
| ⚪ Để biết | FE đang mock vì backend chưa có API — chưa cần làm gì |

---

## 1. Thay đổi phía Backend (đã xong)

### 1.1. Severity chỉ còn 4 giá trị
`Level4` và `Level5` đã **bị xóa khỏi enum và DB** (DB có CHECK constraint, không thể lưu giá trị khác).

| Giá trị JSON | Số | Ý nghĩa |
|---|---|---|
| `"Unclassified"` | 0 | **Reject** / chưa phân loại — báo khống, nấu nướng, diễn tập, hoặc AI lỗi → Operator phải xem thủ công |
| `"Level1"` | 1 | Nhẹ |
| `"Level2"` | 2 | Trung bình |
| `"Level3"` | 3 | Khẩn cấp cao nhất (tự động leo thang) |

- `PUT /api/incidents/{id}/verify` chỉ nhận `confirmedSeverity` = `Level1` / `Level2` / `Level3`. Gửi `Unclassified` sẽ bị **400**. Sự cố cần bác bỏ → gọi `PUT /api/incidents/{id}/cancel`.
- `aiClassification.severityScore` giờ chỉ là `0..3`.

### 1.2. Link API thống nhất — đã xóa link cũ
Chỉ còn tiền tố `/api/...`. Các link sau **trả 404**:

| Link cũ (đã xóa) | Link mới |
|---|---|
| `/api/v1/dispatch/...` | `/api/dispatch/...` |
| `/api/v1/traffic/...` | `/api/traffic/...` |
| `/api/RescueUnits/...` | `/api/rescue-units/...` |
| `/api/v1/escalation-rules` | `/api/escalation/rules` |
| `/api/v1/escalation-logs` | `/api/escalation/logs` |
| `/api/v1/escalation/trigger-check` | `/api/escalation/trigger-check` |

✅ Đã kiểm tra: code Web và Mobile hiện **không gọi** link cũ nào → không cần sửa gì. Khi tích hợp các module trên thì dùng link mới.

---

## 2. 🔴 Bắt buộc sửa

### 2.1. [Web] `Unclassified` đang bị hiển thị thành Cấp 1
**File:** `src/types/incident.ts` (dòng ~19, ~106, ~181–188, ~222)

Hiện tại:
```ts
export type SeverityLevel = 1 | 2 | 3;
export type BackendSeverityLevel = 'Unclassified' | 'Level1' | 'Level2' | 'Level3' | 'Level4' | 'Level5';

const SEVERITY_FROM_BACKEND: Record<BackendSeverityLevel, SeverityLevel> = {
  Unclassified: 1,   // ❌ sự cố Reject / AI lỗi bị hiện như "Cấp 1 - Nhẹ"
  Level1: 1, Level2: 2, Level3: 3,
  Level4: 3, Level5: 3,   // ❌ không còn tồn tại
};
// ...
severity: SEVERITY_FROM_BACKEND[dto.severity] ?? 1,
```

**Vấn đề:** Backend xếp `Unclassified` **lên đầu hàng đợi** vì cần Operator xem gấp, nhưng UI lại gắn nhãn "Cấp 1" (nhẹ nhất) → Operator dễ bỏ qua.

**Đề xuất sửa:**
```ts
export type SeverityLevel = 0 | 1 | 2 | 3;   // 0 = Reject / cần xem thủ công
export type BackendSeverityLevel = 'Unclassified' | 'Level1' | 'Level2' | 'Level3';

const SEVERITY_FROM_BACKEND: Record<BackendSeverityLevel, SeverityLevel> = {
  Unclassified: 0,
  Level1: 1,
  Level2: 2,
  Level3: 3,
};

// Khi verify chỉ cho chọn 1–3 (0 không gửi lên verify, dùng cancel)
const SEVERITY_TO_BACKEND: Record<Exclude<SeverityLevel, 0>, BackendSeverityLevel> = {
  1: 'Level1',
  2: 'Level2',
  3: 'Level3',
};

// ...
severity: SEVERITY_FROM_BACKEND[dto.severity] ?? 0,
```
Sau đó cập nhật các component hiển thị severity (badge, bộ lọc, `IncidentDetailDrawer`) để có nhãn riêng cho mức 0, ví dụ **"Chưa phân loại / Cần xác minh"**. Nếu không muốn đổi type, ít nhất thêm cờ `needsManualReview: dto.severity === 'Unclassified'` thay vì quy về 1.

### 2.2. [Web] Xóa case `Level4` / `Level5`
**File:** `src/components/citizen/CitizenReportsModal.tsx` (dòng ~140–141)
```ts
case 'Level5':   // ❌ xóa
case 'Level4':   // ❌ xóa
case 'Level3':
```
Đồng thời nên thêm case `'Unclassified'` (hiện đang rơi vào `default`).

---

## 3. 🟡 API đã sẵn sàng — chưa tích hợp

### 3.1. [Mobile + Web Citizen] Đường di chuyển xe cứu hộ cho Người dân
API: `GET /api/dispatch/tracking/incident/{incidentId}` (công khai, không cần token).
Trả về vị trí xe, **`routeTrajectory`** (mảng điểm để vẽ polyline), `distanceKm`, `estimatedArrivalMinutes`, các mốc thời gian. Chưa có xe → `dispatchStatus: "PendingDispatch"`.

Mobile — thêm vào `src/api/endpoints.ts`:
```ts
DISPATCH: {
  TRACKING: (incidentId: string) => `/dispatch/tracking/incident/${incidentId}`,
},
```
Type:
```ts
export interface RoutePoint { latitude: number; longitude: number; }

export interface CitizenTracking {
  incidentId: string;
  incidentTitle: string;
  incidentAddress: string;
  incidentLat: number;
  incidentLng: number;
  incidentStatus: string;
  incidentSeverity: 'Unclassified' | 'Level1' | 'Level2' | 'Level3';
  rescueUnitId?: string;
  plateNumber?: string;
  unitTypeName?: string;
  stationName?: string;
  stationPhoneNumber?: string;
  vehicleLat?: number;
  vehicleLng?: number;
  lastLocationUpdateAt?: string;
  routeTrajectory: RoutePoint[];
  distanceKm: number;
  estimatedArrivalMinutes: number;
  dispatchStatus: 'PendingDispatch' | 'Dispatched' | 'Accepted' | 'EnRoute' | 'OnScene' | 'Completed' | 'Cancelled';
  dispatchedAt?: string;
  acceptedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  notes?: string;
}
```
Cách dùng: gọi API 1 lần để vẽ lộ trình → sau đó nghe SignalR (mục 3.3) để di chuyển marker xe realtime → gọi lại API khi nhận `ReceiveAssignmentStatus` hoặc mỗi 15–30 giây để cập nhật lộ trình/ETA.

### 3.2. [Mobile] Gửi SOS thật (hiện đang giả lập)
`HomeScreen.tsx` / `MediaReportModal.tsx` đang dùng `setTimeout` và địa chỉ GPS cố định, chưa gọi API. Mobile đã có `media.service.ts` (upload) nhưng **chưa có incident service**.

```ts
// src/services/incident.service.ts
import { apiService } from '../api/client';   // giống media.service.ts
import { Endpoints } from '../api/endpoints';

export interface CreateIncidentPayload {
  title?: string;
  description: string;
  latitude: number;
  longitude: number;
  locationAddress: string;
  reporterName?: string;
  reporterPhone?: string;
  mediaUrls?: string[];
}

export const incidentService = {
  create: (payload: CreateIncidentPayload) =>
    apiService.post(Endpoints.INCIDENTS.BASE, payload),       // trả về ngay, status = AiProcessing
  getById: (id: string) => apiService.get(Endpoints.INCIDENTS.BY_ID(id)),
  cancel: (id: string, reason?: string) =>
    apiService.put(Endpoints.INCIDENTS.CANCEL(id), { reason }),
};
```
Luồng: lấy GPS thật (`expo-location`) → upload ảnh (`/media/upload`) → `POST /incidents` với `mediaUrls` → lưu `incidentId` → mở màn theo dõi (mục 3.1). Kết quả AI đến sau qua SignalR hoặc gọi lại `GET /incidents/{id}`.

### 3.3. [Web + Mobile] Kết nối SignalR (chưa có client nào)
Backend đã bắn đủ sự kiện realtime nhưng Web/Mobile chưa cài `@microsoft/signalr`.

```bash
npm install @microsoft/signalr
```
```ts
import * as signalR from '@microsoft/signalr';

const BASE = 'http://localhost:5000'; // Android emulator: http://10.0.2.2:5000

export function createHub(path: '/hubs/incidents' | '/hubs/tracking', getToken: () => string | null) {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${BASE}${path}`, { accessTokenFactory: () => getToken() ?? '' })
    .withAutomaticReconnect()
    .build();
}

// Operator dashboard
const incidents = createHub('/hubs/incidents', getAccessToken);
incidents.on('ReceiveNewIncident', (incident) => { /* thêm vào hàng đợi */ });
incidents.on('ReceiveIncidentUpdate', (incident) => { /* cập nhật severity AI, trạng thái */ });
incidents.on('ReceiveJobAssigned', (assignment) => { /* ... */ });
incidents.on('ReceiveAssignmentStatus', (assignment) => { /* ... */ });
incidents.on('ReceiveTrafficHotspot', (hotspot) => { /* ... */ });
incidents.on('ReceiveEscalationAlert', (alert) => { /* còi + popup đỏ */ });
await incidents.start();

// Citizen theo dõi xe (không bắt buộc đăng nhập)
const tracking = createHub('/hubs/tracking', getAccessToken);
tracking.on('ReceiveRescueUnitLocation', (p) => {
  // p = { rescueUnitId, incidentId, latitude, longitude, headingDegrees, speedKmh, timestampUtc }
});
await tracking.start();
await tracking.invoke('SubscribeIncident', incidentId);

// Staff gửi GPS mỗi 3–5 giây (chỉ RescueStaff/Admin)
await tracking.invoke('UpdateLocation', {
  rescueUnitId, incidentId, latitude, longitude, headingDegrees, speedKmh,
});
```
Danh sách đầy đủ sự kiện và nhóm nhận: `API_DOCUMENTATION.md` → Phân hệ 9.

### 3.4. [Web Operator / Staff] Các module đang dùng mock nhưng backend đã có API

| Màn hình (Web) | Đang dùng | API thật |
|---|---|---|
| Live Map / DispatchPanel | `liveMapMock`, `DispatchContext` | `GET /api/dispatch/recommend`, `POST /api/dispatch/assign`, `GET /api/rescue-units`, `GET /api/traffic/active` |
| Staff Portal — nhiệm vụ | `staffMock` | `GET /api/dispatch/my-assignments`, `PUT /api/dispatch/assignments/{id}/status`, `POST /api/dispatch/assignments/{id}/resolve` |
| Admin — Trạm | `stationAdminService` (mock) | `/api/stations` (CRUD) |
| Admin — Xe | `vehicleAdminService` (mock) | `/api/rescue-units` (CRUD + `/status`, `/location`) |
| Admin — Tài khoản | `accountAdminService` (mock) | `GET/POST /api/users`, `PUT/DELETE /api/users/{id}` |
| Admin — Leo thang | `adminSettingsService` (mock) | `/api/escalation/rules`, `/api/escalation/logs` |
| Admin — Tổng quan | `overviewAdminService` (mock) | `GET /api/dashboard/stats` |

Body / query chi tiết: xem `API_DOCUMENTATION.md` Phân hệ 5, 6, 7, 10, 11, 12, 13.

---

## 4. ⚪ Để biết — backend chưa có, FE cứ giữ mock

| Tính năng FE | File FE | Ghi chú backend |
|---|---|---|
| **Tổ làm việc dạng thực thể** (id, tên, xe phụ trách, thành viên, tổ trưởng) | `services/stationTeamService.ts`, `types/stationTeam.ts` | Backend hiện chỉ lưu **tên tổ** dạng text cho từng nhân viên (`PUT /api/users/{id}/assign-station-team`, `GET /api/users/my-team`). Chưa có `StationTeam` (vehicleId, crewRole, tổ trưởng). Backend sẽ làm entity riêng — khi xong sẽ cập nhật file này kèm contract. |
| Khóa sự cố khi Operator đang xử lý (`lockedByOperatorId`, `lockExpiresAt`) | `types/incident.ts`, `IncidentDetailDrawer.tsx` | `IncidentResponseDto` chưa có các field này → luôn `undefined`. |
| Thông báo cho Staff (danh sách, đã đọc) | — | Chưa có `GET /api/notifications`. Hiện chỉ nhận realtime qua `ReceiveJobAssigned`. |
| Đóng hồ sơ sự cố / Audit trail / Báo cáo của tôi | `AuditTrailPage`, `CitizenReportsModal` | Chưa có `/incidents/{id}/close`, `/incidents/{id}/audit-trail`, `/incidents/my-reports`. |

---

## 5. Đối chiếu với SRS (Report3) — Web đang làm sai hoặc ngoài phạm vi

> Nguồn đối chiếu: `Report3_Software Requirement Specification.md` (bản 29/09) và repo `emergency-dispatch-frontend` tại commit `ec36793`.

### 5.1. 🔴 Làm sai so với SRS

| # | Vấn đề | Vị trí | SRS nói gì | Đề xuất |
|---|---|---|---|---|
| 1 | **Bỏ hẳn Level 0**: comment ghi *"Cấp 1–3, không có Cấp 0. AI không phân loại được → Cấp 1 + % tin cậy thấp"* | `types/incident.ts:18-19`, `:182`, `:222` | FR-OP-02, FR-SYS-01: Level 0 (Reject / cần xác minh) được xếp **ngang Level 3 ở đầu hàng đợi**, có banner `[⚠️ LEVEL 0 - AI REJECTED: VERIFICATION REQUIRED]`; **cấm hạ ưu tiên** Level 0 | Thêm mức 0 vào `SeverityLevel` (xem mục 2.1), có badge/banner riêng |
| 2 | **Không có tag `fire` thì mặc định là Tai nạn** | `types/incident.ts:220` → `category: hazardTags.includes('fire') ? 'fire' : 'accident'` | FR-SYS-01: EventType = `FireExplosion` / `TrafficAccident` / `None` | Sự cố AI lỗi (tags `Unclassified`) bị coi là tai nạn → gợi ý nhầm xe cứu thương. Thêm loại `'unknown'` và bắt Operator chọn khi duyệt. Backend sẽ bổ sung trường `eventType` (xem 5.4) |
| 3 | **Đếm ngược 120 giây** để đội cứu hộ Chấp nhận / Từ chối, quá hạn tự trả xe | `data/dispatchConfig.ts:4-5`, `context/DispatchContext.tsx:27,117-161,417-457`, `types/vehicle.ts` (`awaiting_ack`, `ackDeadline`), `types/incident.ts:31` (`kind: 'timeout'`) | Change log SRS 26/09/2026: **"Removed … 120s dispatch countdown (FR-OP-04, FR-RS-01, BR-21)"** | Gỡ timeout tự động; chỉ giữ Chấp nhận / Từ chối kèm lý do (BR-22) |
| 4 | **Bàn giao bằng QR** trong báo cáo kết thúc ca | `components/staff/StaffQrHandover.tsx`, import tại `StaffClosureReportModal.tsx:22` | Change log 26/09: **"Removed … FR-RS-04 (QR handover)"** | Gỡ khỏi `StaffClosureReportModal` |
| 5 | **Leo thang chỉ xét Cấp 3** | `utils/escalation.ts:22` → `if (incident.severity !== 3) return false;` | FR-SYS-02: quét `SeverityScore IN (0, 3)` | Thêm Level 0 (sau khi sửa #1) |
| 6 | Vẫn còn **thang cũ 0–5** (`IncidentSeverity`) cho Staff portal và Admin escalation | `types/incident.ts:3-5`, `types/dashboard.ts` | Thang chuẩn 0–3 | Gộp về một kiểu duy nhất |
| 7 | **Báo cáo kết thúc ca không có validation**: xóa hết ảnh vẫn nộp được; ảnh, số nạn nhân (`2`), tóm tắt, nơi bàn giao **được điền sẵn dữ liệu mẫu**; `teamLeader` viết cứng `'Nguyễn Văn An'`; thiếu chữ ký thì tự gán `'SIGNED-DIGITALLY'` | `StaffClosureReportModal.tsx:46-130` | FR-RS-03 / BR-25: bắt buộc ≥ 1 ảnh (MSG42), số nạn nhân ≥ 0, tóm tắt 10–1000 ký tự | Bỏ giá trị mặc định, chặn nộp khi thiếu ảnh hoặc tóm tắt < 10 ký tự, lấy tổ trưởng từ tài khoản đăng nhập. Backend `resolve` cũng đang yêu cầu `resolutionSummary` tối thiểu 10 ký tự |

> ⚠️ SRS **tự mâu thuẫn** về ngưỡng leo thang: FR-SYS-02 ghi **5 phút** (đêm 2.5 phút, BR-19), còn BR-17 ghi **3 phút** cho Level 3 (MSG46 cũng ghi 3 phút). Web đang dùng 5 / 2.5 phút, backend mặc định 3 phút. **Nhóm cần chốt một con số** và sửa lại SRS.

### 5.2. 🟠 Logic nghiệp vụ đang chạy ở client (phải chuyển về backend)
Các phần dưới đây là **nguồn sự thật nằm trong trình duyệt** — mỗi Operator mở tab sẽ tính ra kết quả riêng, không đồng bộ và không ghi nhận được cho nghiên cứu RQ2/RQ3. Giữ được để demo UI, nhưng khi tích hợp phải lấy kết quả từ API:

| Logic | File FE | API backend thay thế |
|---|---|---|
| Thuật toán gợi ý xe (Nearest / Load-Aware, mở rộng bán kính) | `utils/dispatch.ts` | `GET /api/dispatch/recommend` |
| Phát hiện leo thang | `utils/escalation.ts` | SignalR `ReceiveEscalationAlert` |
| Vòng đời xe, hồi sức 5 phút | `context/DispatchContext.tsx` | `ReceiveAssignmentStatus`, `GET /api/rescue-units` |

### 5.3. 🟡 Ngoài phạm vi SRS — cần nhóm xác nhận trước khi làm tiếp

| Tính năng | File chính | Quy mô | Ghi chú |
|---|---|---|---|
| **Xếp ca trực / Lịch ca / Xin nghỉ / Đổi ca / Sao chép tuần / Tăng ca / Check-in-out** | `pages/admin/ShiftsPage.tsx`, `services/admin/shiftService.ts`, `components/staff/schedule/*` (8 file), `types/shift.ts`, `data/admin/shiftSeed.ts` | **~4.400 dòng** | SRS không có FR nào cho quản lý ca. Backend chưa có và chưa có kế hoạch làm |
| Chữ ký điện tử khi kết thúc ca | `components/staff/StaffSignaturePad.tsx` | ~150 dòng | Không có trong FR-RS-03 |
| Khóa / mở khóa tài khoản Citizen bởi Admin | `pages/admin/CitizensPage.tsx`, `services/admin/citizenAdminService.ts` | ~250 dòng | Không có FR tương ứng (SRS chỉ có chặn số spam ở FR-OP-03) |
| "Trưởng trạm" (`headOperatorId`) — Operator quản lý trạm | `types/adminFleet.ts:31-32`, `types/stationTeam.ts` | — | SRS chỉ nhắc *Station Commander* là người **nhận cảnh báo leo thang**, không phải vai trò quản lý trạm |
| Tổ làm việc có tổ trưởng / vai trò kíp / xe phụ trách | `services/stationTeamService.ts` | ~1.100 dòng (commit `ec36793`) | Có trong yêu cầu nhóm ("Operator thêm staff vào trạm và Tổ làm việc") nhưng **SRS chưa mô tả**. Cần chốt thiết kế với backend trước khi làm tiếp (xem mục 4) |

### 5.4. Lệch tên gọi Web ↔ Backend (cần thống nhất khi tích hợp)
Các `TODO(backend)` trong Web đang ghi **tên API tự đặt** không khớp backend:

| Web dự kiến | Backend thực tế |
|---|---|
| `/api/Vehicles`, `PATCH /api/Vehicles/{id}/status` | `/api/rescue-units`, `PUT /api/rescue-units/{id}/status` |
| `GET /api/Users?roles=Operator,RescueStaff` | `GET /api/users?role=` (lọc **1** role mỗi lần) |
| `/api/Settings/escalation`, `/api/Settings/dispatch` | Chưa có — hiện chỉ có `/api/escalation/rules` |
| `/api/AuditTrail` | Chưa có |
| `/api/Citizens`, `/api/BlockedPhoneNumbers`, `/api/Shifts` | Chưa có |

**Trạng thái xe** — Web và backend dùng hai bộ khác nhau:

| Web (`types/vehicle.ts`, `adminFleet.ts`) | Backend `RescueUnitStatus` |
|---|---|
| `available` | `Available` |
| `awaiting_ack` | *(bỏ — xem 5.1 #3)*, tương ứng assignment `Dispatched` |
| `accepted`, `en_route` | `Dispatched` (chi tiết nằm ở assignment: `Accepted`, `EnRoute`) |
| `on_scene` | `OnScene` |
| `recovering` | *(chưa có — backend sẽ bổ sung CoolDown)* |
| `maintenance` | `Maintenance` |
| `out_of_service` | *(chưa có)* |

**Loại xe**: Web có 4 loại (`ambulance`, `fire_truck`, `police`, `rescue`), backend có 6 (`Ambulance`, `FireTruck`, `LadderTruck`, `RescueBoat`, `HeavyRescueVehicle`, `PolicePatrol`). Đề xuất map `rescue` ↔ `HeavyRescueVehicle`, `police` ↔ `PolicePatrol`, và hiển thị thêm `LadderTruck`, `RescueBoat`.
