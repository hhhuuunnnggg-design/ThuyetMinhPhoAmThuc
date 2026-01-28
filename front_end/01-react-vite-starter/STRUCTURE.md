# Cấu Trúc Thư Mục Frontend

## 📁 Tổng Quan Cấu Trúc

```
src/
├── api/                    # API services (tách theo module)
│   ├── axios.ts           # Axios instance với interceptors
│   ├── auth.api.ts        # Authentication APIs
│   ├── user.api.ts        # User management APIs
│   ├── role.api.ts        # Role management APIs
│   ├── permission.api.ts  # Permission management APIs
│   ├── post.api.ts        # Post APIs
│   ├── comment.api.ts     # Comment APIs
│   ├── chatbot.api.ts     # Chatbot APIs
│   └── index.ts           # Export tất cả APIs
│
├── components/             # React components
│   ├── admin/             # Admin panel components
│   │   ├── Layout/
│   │   │   └── AdminLayout.tsx    # Admin layout với sidebar
│   │   ├── User/          # User management components
│   │   ├── Role/          # Role management components
│   │   └── Permission/    # Permission management components
│   │
│   ├── common/            # Shared/common components
│   │   ├── Error404Route.tsx     # 404 Error page
│   │   ├── protectedRoute.tsx     # Route protection (AdminRoute, ProtectedRoute)
│   │   └── restricted.tsx         # Permission-based component visibility
│   │
│   ├── context/           # React Context providers
│   │   └── app.context.tsx        # App context (đồng bộ với Redux)
│   │
│   └── layout/            # Layout components
│       ├── ClientLayout.tsx        # Client layout (cho pages thường)
│       ├── AppHeader.tsx           # Header component
│       ├── AppHeader.scss          # Header styles
│       ├── FacebookPostList.tsx    # Post list component
│       ├── ModalChatbotAI.tsx      # Chatbot modal
│       └── modal.upload.tsx        # Upload modal
│
├── config/                 # Configuration files
│   └── index.ts           # App configuration (env vars, etc.)
│
├── constants/             # Application constants
│   └── index.ts           # API endpoints, routes, storage keys
│
├── hooks/                  # Custom React hooks
│   └── useCommentSocket.ts
│
├── pages/                  # Page components
│   └── client/
│       ├── auth/
│       │   ├── login.tsx
│       │   ├── login.scss
│       │   ├── register.tsx
│       │   └── register.scss
│       └── book.tsx
│
├── redux/                  # Redux state management
│   ├── store.ts           # Redux store configuration
│   ├── hooks.ts           # Typed Redux hooks
│   └── slice/
│       └── auth.slice.ts  # Auth state & actions
│
├── styles/                 # Global styles
│   └── global.scss
│
├── types/                  # TypeScript type definitions
│   ├── global.d.ts        # Global interfaces (IUser, IRole, etc.)
│   ├── axios.d.ts
│   └── sockjs-client.d.ts
│
├── utils/                  # Utility functions (placeholder)
│
├── layout.tsx              # ❌ ĐÃ XÓA - Di chuyển vào ClientLayout.tsx
├── main.tsx                # Entry point
└── vite-env.d.ts
```

## 🔄 Những Thay Đổi Chính

### 1. **API Layer** (`services/` → `api/`)
- ✅ Tách `api.ts` thành các file theo module:
  - `auth.api.ts` - Authentication
  - `user.api.ts` - User management
  - `role.api.ts` - Role management
  - `permission.api.ts` - Permission management
  - `post.api.ts`, `comment.api.ts`, `chatbot.api.ts`
- ✅ Đổi tên `axios.customize.ts` → `api/axios.ts`
- ✅ Tạo `api/index.ts` để export tất cả APIs

### 2. **Layout Components**
- ✅ Di chuyển `layout.tsx` (root) → `components/layout/ClientLayout.tsx`
- ✅ Đổi tên `layout.admin.tsx` → `AdminLayout.tsx` (PascalCase)
- ✅ Đổi tên `app.header.tsx` → `AppHeader.tsx` (PascalCase)
- ✅ Đổi tên `app.header.scss` → `AppHeader.scss`
- ✅ Đổi tên `Modal.ChatbotAI.tsx` → `ModalChatbotAI.tsx`

### 3. **Folder Mới**
- ✅ `config/` - Configuration files
- ✅ `constants/` - Application constants (API endpoints, routes, etc.)
- ✅ `utils/` - Utility functions (placeholder)

### 4. **Naming Convention**
- ✅ Tất cả component files dùng **PascalCase**: `ClientLayout.tsx`, `AppHeader.tsx`
- ✅ Tất cả API files dùng **kebab-case**: `auth.api.ts`, `user.api.ts`
- ✅ SCSS files khớp với component: `AppHeader.scss`

## 📝 Import Patterns

### API Imports
```typescript
// ✅ Đúng - Import từ @/api
import { loginAPI, logoutAPI } from "@/api";
import axios from "@/api/axios";

// ❌ Sai - Không dùng nữa
import { loginAPI } from "@/services/api";
import axios from "@/services/axios.customize";
```

### Component Imports
```typescript
// ✅ Đúng
import ClientLayout from "@/components/layout/ClientLayout";
import AdminLayout from "@/components/admin/Layout/AdminLayout";
import AppHeader from "@/components/layout/AppHeader";

// ❌ Sai - Không dùng nữa
import Layout from "./layout";
import LayoutAdmin from "./components/admin/Layout/layout.admin";
```

## 🎯 Best Practices

1. **API Organization**: Mỗi module có file API riêng, dễ maintain và scale
2. **Component Naming**: PascalCase cho components, kebab-case cho utilities
3. **Separation of Concerns**: 
   - `api/` - API calls
   - `components/` - UI components
   - `pages/` - Page-level components
   - `redux/` - State management
   - `config/` - Configuration
   - `constants/` - Constants
4. **Path Aliases**: Sử dụng `@/` cho imports từ `src/`

## 📦 Dependencies

- React 18.3.1
- Redux Toolkit 1.9.7
- React Router v6
- Ant Design 5.21.6
- Axios 1.7.7
- TypeScript 5.6.3
- Vite 5.4.8

## 🚀 Next Steps

1. Thêm utility functions vào `utils/` khi cần
2. Sử dụng constants từ `constants/index.ts` thay vì hardcode
3. Có thể tách thêm features nếu dự án lớn hơn
4. Thêm unit tests cho các utilities và hooks
