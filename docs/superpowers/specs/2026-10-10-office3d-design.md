# Web Mô Phỏng Văn Phòng 3D — Design Spec

Ngày: 2026-10-10
Trạng thái: Đã trình bày & chấp thuận theo từng phần trong hội thoại.

## 1. Mục tiêu & Bối cảnh

Người dùng làm việc trong team 7 người, dùng Jira để quản lý công việc. Muốn
một trang web 3D văn phòng để gắn vào môi trường làm việc của team — tính chất
**vui mắt, trang trí, tạo cảm giác team hóa**, không phải sản phẩm thương mại.
Yêu cầu thị giác: chi tiết, rõ nét, giống ảnh tham khảo `mau.jpg` (isometric,
low-poly/blocky, sàn tô màu theo zone, nhãn tên nhân viên tiếng Việt).

Thành công khi: mở trang là thấy ngay phòng 3D + 7 nhân vật + tên người, tương
tác mượt (xoay, zoom, bấm xem chi tiết, Day/Night), chạy được trên host tĩnh.

## 2. Phạm vi

### Trong phạm vi (In Scope)

- Scene 3D isometric dựng bằng Three.js thuần (primitive geometry, không tải model ngoài)
- Phòng văn phòng kín: sàn, tường, cửa sổ, lan can, tường tô điểm
- 7 workstation dạng cubicle, xếp 2 dãy đối mặt có lối đi giữa
- 7 nhân vật blocky phân biệt được bằng màu da, tóc, áo, phụ kiện
- Nhãn tên nhân viên nổi trên đầu, hiển thị trạng thái
- Trạng thái: `working` / `idle` / `offline` + animation tương ứng
- Camera: xoay, zoom, center lại; toggle góc nhìn 2D/3D
- Chế độ Day / Night (đèn, màu nền, bóng đổ, màn hình phát sáng)
- Bấm nhân viên → popup chi tiết (tên, role, team, trạng thái, nút Assign work, link Jira)
- Panel trái: danh sách team, thống kê working/idle/offline, avatar
- Bộ lọc theo team (zone màu)
- Thêm / sửa nhân viên qua form (danh sách lưu trong localStorage)
- Trang trí: cây xanh, kệ cúp, logo tường, vách kính, cột

### Ngoài phạm vi (Out of Scope)

- Backend, API server, database
- Tích hợp Jira API thật
- Tạo model 3D bằng AI / import file GLTF
- Đăng nhập, phân quyền, multi-user realtime
- Di động native app

## 3. Kiến trúc

Project Vite + React + TypeScript. Render 3D bằng **Three.js thuần**
(không React Three Fiber) vì toàn bộ geometry là primitive tự dựng; thêm lớp
abstraction của R3F chỉ tốn thêm chi phí mà không giảm được công việc.

```
(thư mục gốc project = thư mục hiện tại, đã có sẵn mau.jpg và docs/)
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ package.json
├─ public/                      # avatar ảnh (nếu người dùng cung cấp)
├─ tests/                       # unit test Vitest, mirror cấu trúc src
├─ src/
   ├─ main.tsx                  # mount React root
   ├─ App.tsx                   # layout tổng thể, điều phối state
   ├─ types.ts                  # Staff, Team, StaffStatus, ViewMode, ThemeMode
   ├─ store/officeStore.ts      # zustand store: staff list, filter, viewMode, theme
   ├─ data/staff.ts             # 7 nhân viên mặc định + team + zone color
   ├─ lib/                      # logic thuần, có unit test, không phụ thuộc Three/DOM
   │  ├─ grid.ts                # toạ độ ô grid
   │  ├─ status.ts              # computeStatusCounts, màu & nhãn trạng thái
   │  ├─ zoom.ts                # mapZoomToPercent / mapPercentToDistance
   │  ├─ zone.ts                # zoneColorFor
   │  ├─ staffForm.ts           # validateStaffForm, staffFromForm, initialsOf
   │  └─ storage.ts             # loadStaff / saveStaff
   ├─ scene/
   │  ├─ OfficeScene.ts         # class điều phối renderer/camera/controls/loop
   │  ├─ world.ts               # ráp room + workstation + nhân vật thành 1 Group
   │  ├─ room.ts                # sàn, tường, cửa sổ, lan can, logo tường
   │  ├─ workstation.ts         # 1 cubicle: bàn, ghế, màn hình, vách ngăn
   │  ├─ character.ts           # 1 nhân vật blocky theo Staff spec
   │  ├─ decor.ts               # cây xanh, kệ cúp, cột
   │  ├─ materials.ts           # palette material dùng chung (tối ưu draw call)
   │  ├─ animation.ts           # hàm update(delta, status) cho từng nhân vật
   │  ├─ cameraRig.ts           # góc isometric cố định, zoom, 2D/3D, center
   │  ├─ raycaster.ts           # chọn nhân vật bằng click
   │  ├─ nameLabel.ts           # nhãn tên dạng sprite/canvas texture
   │  ├─ theme.ts               # themeSpec(day|night) + applyTheme
   │  └─ dots.ts                # chấm tròn cho chế độ 2D
   ├─ components/
   │  ├─ HeaderBar.tsx          # logo, counter staff, toggle 2D/3D, Hire staff
   │  ├─ TeamSidebar.tsx        # tab Activity, avatar list, thống kê, bộ lọc
   │  ├─ StaffCard.tsx          # popup chi tiết + Assign work + link Jira
   │  ├─ BottomBar.tsx          # zoom -, %, +, center, Day/Night
   │  ├─ HireDialog.tsx         # form thêm/sửa nhân viên
   │  └─ StatusPill.tsx         # chấm trạng thái working/idle/offline
   ├─ hooks/
   │  ├─ useOfficeEngine.ts     # kết nối React ↔ OfficeScene
   │  └─ usePersistedStaff.ts   # localStorage load/save danh sách nhân viên
   └─ styles.css
```

### Luồng dữ liệu

```
data/staff.ts  ──▶  officeStore (zustand)  ──┬──▶  React UI (sidebar, header, card)
                                             └──▶  OfficeScene (đặt nhân vật đúng toạ độ)
```

- React **không** re-render scene khi chỉ đổi state UI không liên quan (store dùng selector).
- Scene đọc danh sách nhân viên một lần lúc mount; đổi danh sách → diff cập nhật
  (thêm/xoá nhân vật), không dựng lại cả phòng.

### Cấu trúc file re-render

React giữ overlay DOM. `OfficeScene` giữ `THREE.WebGLRenderer` gắn sẵn vào một
`<div ref>`; chỉ `useOfficeEngine` đọc ref. Mọi animation 3D chạy trong
`renderer.setAnimationLoop`, không phụ thuộc React render cycle.

## 4. Chi tiết Scene — Shape & Material

### Nhân vật (`buildCharacter`)

Signature: `buildCharacter(spec: CharacterSpec): THREE.Group`

Tổng chiều cao ~`1.6` đơn vị thế giới, **6 khối hộp** xếp chồng:

| Bộ phận | Kích thước | Ghi chú |
|---|---|---|
| `head` | `0.55 × 0.55 × 0.55` | vuông, đặt trên cùng |
| `torso` | `0.6 × 0.5 × 0.35` | áo dài tay |
| `arm.left/right` | `0.18 × 0.45 × 0.22` | neo tại vai — là pivot để xoay đánh máy |
| `leg.left/right` | `0.22 × 0.5 × 0.24` | quần màu tối; khi ngồi, đầu gối gập lại chỉ nhìn thấy phần trên |
| `chairSeat` | `0.45 × 0.06 × 0.45` | mông ngồi cách sàn `0.42` |

Số khối hộp tạo nên 1 nhân vật: `head`, `torso`, 2 `arm`, 2 `leg`, `chairSeat`
= **7 mesh chính**, cộng mặt (2 mắt + miệng = 3 mesh nhỏ dùng chung material
đen) và biến thể tóc/phụ kiện ở trên nữa. Phần xoay được chỉ gồm `head` và
2 `arm`.

Biến thể phân biệt 7 người (`CharacterSpec`):

- `skinTone` — 4 tone mặc định (sáng → ngăm)
- `hairColor` — đen, nâu, vàng, xám
- `hairStyle` — `'bald' | 'short' | 'cap' | 'long'`; `long` thêm 2 hộp sau đầu,
  `cap` thêm 1 hộp che đỉnh đầu, `short` thêm 1 hộp mỏng trên đỉnh
- `accessory` — `'none' | 'glasses' | 'lanyard'`; `glasses` = 2 vòng tròn mảnh
  trước mắt, `lanyard` = hộp mảnh thắt cổ
- `shirtColor`, `pantsColor`

### Workstation (`buildWorkstation`)

Tạo 1 cubicle tại một ô grid, gồm:

- **Bàn**: thân chính `1.8 × 0.08 × 0.75` (mặt bàn), 4 chân đen nhỏ, 1 kệ phụ
  đặt bàn phím
- **Màn hình**: khung viền + mặt màn hình + chân đế + vỏ lưng; mặt màn hình
  dùng `MeshStandardMaterial` có `emissive` màu xanh da trời. `working` →
  `emissiveIntensity 0.6`; `idle`/`offline` → `0.05`
- **Ghế**: đế trụ + mặt ghế + tựa lưng nghiêng về phía bàn + 4 bánh xe nhỏ
- **Vách ngăn**: tấm panel trong suốt (`opacity 0.25`, `transparent: true`) màu
  theo zone của nhân viên — đây là yếu tố tạo nên các vùng màu trong ảnh mẫu
- **Phụ kiện bàn**: ly nước, bụi cây nhỏ hoặc stack giấy (xoay vòng theo index)

### Vật liệu dùng chung (`materials.ts`)

Mọi material khai báo **một lần** tại đây và được reuse cho tất cả mesh —
key theo tên (`deskWood`, `chairBlack`, `screenOn`, `partition`...),
tránh tạo mới mỗi mesh (giảm memory và draw call).

Ghế/panel zone cần màu động theo team → dùng `material.clone()` riêng cho
panel zone (số lượng bằng số team, tối đa 4), không clone cho từng nhân viên.

## 5. Chi tiết Nghiệp vụ (Business Logic)

### Trạng thái nhân viên

Trạng thái là **một trường duy nhất** `staff.status: 'working' | 'idle' | 'offline'`
(không dùng cờ `isWorking` riêng — tránh hai nguồn sự thật).

| Trạng thái | Hình ảnh |
|---|---|
| `working` | Tay đánh máy, màn hình sáng, nhãn có dấu tick xanh |
| `idle` | Nhịp thở, thỉnh thoảng quay đầu, màn hình mờ |
| `offline` | Nhân vật mờ (opacity 0.4), nhãn xám, không animation |

Trạng thái khởi tạo theo `status` trong `src/data/staff.ts`. Bảng mặc định cân
bằng thủ công cho 7 người: 4 `working`, 2 `idle`, 1 `offline` — không sinh ngẫu
nhiên, để lúc mở trang luôn giống nhau và kiểm thử được. Có nút "Reset demo
state" để quay về bảng mặc định.

### Toạ độ workstation

Grid mặc định 2 hàng × 4 cột = **8 ô**. 7 ô đầu cho 7 nhân viên, ô cuối để
trống hiển thị dấu `+` ("Hire another") như trong ảnh mẫu:

- Cột `c = 0..3`, toạ độ x: `-5.4 + c * 3.6`
- Hàng 0 (sâu): `z = -2.4`; hàng 1 (gần camera): `z = 2.4`
- Toạ độ ô = **vị trí mông ngồi** của nhân vật; bàn và màn hình đặt phía trước
  (`+z`, về phía camera), nên cả 2 hàng đều nhìn thấy mặt nhân vật — đúng kiểu
  ảnh mẫu, nhãn tên luôn đọc được
- `y = 0` (đứng trên sàn), mặt ghế cách sàn `0.42`
- Khi số nhân viên vượt quá 8 ô → thêm hàng theo công thức `z = 2.4 + row * 5.4`

Sàn zone: mỗi nhân viên thuộc 1 team → màu zone riêng (pastel). Vùng zone là
hình chữ nhật bao quanh chỗ ngồi, vẽ bằng box mỏng dày `0.02` có
`polygonOffset: true, polygonOffsetFactor: -1` để không z-fighting với sàn chính.

### Phân team (7 người)

Danh sách mặc định lấy theo **tên thật 7 thành viên team người dùng** — người
dùng sẽ cung cấp; spec dùng tên giữ chỗ `Người 1..7` và bảng mapping do người
dùng điền trong `src/data/staff.ts`. Mỗi team có: `id`, `name`, `color` (mã hex
pastel), `icon`.

### Animation

- `working`: hai tay xoay theo trục X trong khoảng `±22°`, chu kỳ `0.22s`,
  dùng `sin` có easing; đầu hơi cúi `x = -0.08`
- `idle`: torso `scale.y` dao động `1.0 ↔ 1.03` chu kỳ 3.2s; mỗi 4–7s head
  quay `±0.35` rad trong 1.1s rồi về giữa (dùng easing ease-in-out)
- `offline`: đóng băng; nhóm nhân vật đặt `material.opacity = 0.4`, `transparent = true`
- Mọi animation dùng `clock.getDelta()`, không dùng thư viện animation ngoài

## 6. Giao diện (UI)

### HeaderBar (trên cùng)

`My Company` • `{total} staff · {working} working` • toggle `2D / 3D` • nút
`+ Hire staff` • góc phải `Share company` (copy link clipboard).

### Sidebar (trái)

Tab `Activity` (danh sách activity gần đây) và `Team` (nhóm theo team).

- Dòng mỗi nhân viên: avatar tròn (ảnh thật nếu có, không thì chữ đầu + màu),
  tên, role, chấm trạng thái màu.
- Bộ lọc team: chip màu, bấm để chỉ hiện nhân viên team đó (nhân viên khác mờ
  đi trong scene, không bị xoá).
- Ô thống kê: `Working x • Idle y • Offline z`.
- Cột dưới: icon ngành nghề (marketing, dev, design, sales...).

### StaffCard (popup)

Bấm nhân vật → popup gần vị trí nhân vật, giữ trong viewport. Nội dung: avatar
to, tên, role, team, trạng thái, mô tả ngắn, nút `Assign work`, link `Mở Jira`
(mở tab mới theo `jiraUrl` trong data). Đóng bằng `Esc`, click ngoài, hoặc nút `×`.

### BottomBar (dưới cùng)

`–  51%  +` (zoom % rời rạc: 51–100) • nút căn giữa (`locate`) • `Day / Night`
(toggle 2 trạng thái) • góc phải nút `Assign work to the team`.

## 7. Camera & Điều khiển

- Góc nhìn 3D mặc định: `position (26, 19.5, 26)`, `lookAt (0, 1.2, 0)`, `fov 35`.
  Khoảng cách từ camera đến target đúng bằng `45` nên lúc mở trang hiển thị `51%`
  — trùng mặc định trong ảnh mẫu.
- `OrbitControls`: `enableDamping`, `dampingFactor 0.08`, `maxPolarAngle 72°`
  (chặn nhìn từ dưới sàn), `minDistance 12`, `maxDistance 45`.
- Hiển thị zoom %: `mapRange(distance, 45→12, 51%→100%)`, làm tròn.
- Toggle 2D: chuyển sang `THREE.OrthographicCamera` tại `position(0.001, 30, 0)`
  nhìn thẳng xuống vuông góc (không còn phối cảnh); các nhân vật 3D ẩn đi, thay
  bằng chấm tròn đặt trên sàn + nhãn tên. Toggle về 3D khôi phục camera phối
  cảnh và góc nhìn trước đó. Chỉ tồn tại **một** camera tại một thời điểm —
  không dựng hai scene.
- Nút center: tự lerp 0.6s (ease-in-out) về góc mặc định, dùng đồng hồ nội bộ,
  không thêm thư viện animation.

## 8. Xử lý lỗi & Biên

- WebGL không khả dụng → hiện thông báo "Trình duyệt không hỗ trợ WebGL".
- Danh sách nhân viên nhiều hơn 8 ô → tự thêm hàng theo công thức grid ở Mục 5
- `localStorage` bị chặn (private mode) → chạy với danh sách mặc định, báo nhẹ.
- Ảnh avatar lỗi 404 → fallback chữ cái đầu + màu nền.
- Cửa sổ resize → cập nhật camera aspect + renderer size (debounce 100ms).
- Nhân viên bị trùng toạ độ: grid gán index 1-1, không thể trùng do dữ liệu;
  nếu index bị thiếu thì `workstationPosition` lấy modulo độ dài grid để luôn
  có ô hợp lệ (không tạo vị trí chồng lấn thủ công).

## 9. Testing

- **Unit test (Vitest)** cho phần logic thuần trong `src/lib/`:
  - `computeStatusCounts(staff)` → đúng số working/idle/offline
  - `workstationPosition(index)` → đúng toạ độ grid (x theo cột, z theo hàng);
    index 7 (ô trống cuối) trả về vị trí không trùng 7 ô đầu
  - `mapZoomToPercent(distance)` → `distance = 12` trả 100, `distance = 45` trả
    51, giá trị giữa nằm trong khoảng (51, 100) và giảm đều khi distance tăng
  - `validateStaffForm(values)` → thiếu tên bị từ chối, màu không phải hex hợp
    lệ bị từ chối
  - `loadStaff`/`saveStaff` → ghi rồi đọc lại ra đúng dữ liệu; JSON hỏng hoặc
    không phải mảng trả về danh sách mặc định
  - `initialsOf(name)` → lấy đúng chữ cái đầu tiếng Việt, tên 1 từ vẫn hoạt động
- **Build kiểm tra**: `npm run build` phải pass, không có lỗi TypeScript.
- **Kiểm tra thủ công**: mở trang, xác nhận thấy phòng + 7 nhân vật + nhãn
  tên; xoay/zoom; bấm từng nhân vật; toggle Day/Night; toggle 2D/3D; thêm nhân
  viên mới qua Hire staff; refresh trang vẫn giữ danh sách.

## 10. Rủi ro & Giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Scene nặng, FPS thấp trên máy yếu | Dùng chung material, `THREE.BufferGeometry` merge nội bộ; giới hạn bóng đổ `shadowMap` chỉ cho đèn chính; tắt shadow ở chế độ 2D |
| Quá nhiều object con trong 1 group nhân vật | Chỉ ~7 mesh chính + tối đa 6 mesh nhỏ cho mặt/tóc/phụ kiện; vật liệu chia sẻ nên số draw call vẫn thấp |
| Nhãn tên chồng lên nhau | Sprite nhãn có `sizeAttenuation` và scale theo khoảng cách; tắt nhãn khi zoom < 70% |
| Không có ảnh avatar thật 7 người | Fallback chữ cái đầu + màu nền, cho phép upload ảnh sau |

## 11. Thứ tự triển khai (tham khảo cho plan)

1. Scaffold Vite + TS + Vitest + zustand, cấu trúc thư mục, styles cơ bản
2. Logic thuần trong `src/lib/` (grid, status, zoom, storage, staffForm) + test
3. Palette vật liệu + `character.ts` + `nameLabel.ts` + animation 3 trạng thái
4. `workstation.ts` (bàn, ghế, màn hình, vách ngăn) + sàn zone màu
5. `room.ts` + `decor.ts` (tường, cửa sổ, lan can, cây, kệ cúp, logo)
6. `cameraRig.ts` + OrbitControls + zoom % + center + 2D/3D toggle
7. `raycaster.ts` + chọn nhân vật + `StaffCard` popup
8. `HeaderBar`, `TeamSidebar`, `BottomBar` + store wiring
9. `HireDialog` + localStorage persistence
10. Day/Night theme cho toàn bộ scene
11. Polish, kiểm tra build, xử lý biên

## 12. Dependencies

Tối thiểu, không thêm gói nào khác nếu không thật sự cần:

| Gói | Vai trò |
|---|---|
| `three` | Scene, geometry, camera, renderer, raycaster |
| `react`, `react-dom` | Lớp UI overlay |
| `zustand` | Store chia sẻ giữa React và scene |
| `vite`, `@vitejs/plugin-react`, `typescript` | Build + type-check (devDependency) |
| `vitest` | Unit test cho logic thuần (devDependency) |

Không dùng: React Three Fiber, drei, GSAP, Framer Motion, bất kỳ thư viện
animation hay model-loading nào.

## 13. Dữ liệu người dùng cần cung cấp

1. Tên + role của 7 thành viên team
2. Tên 3 team / zone màu mong muốn (hoặc để mặc định)
3. Link Jira board hoặc URL assign work (nếu muốn nút hoạt động thật)
4. Ảnh avatar 7 người (tuỳ chọn)
