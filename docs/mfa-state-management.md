# Zustand / Pinia를 MFA에서 안전하게 쓰는 방법

MFA에서 상태 관리는 다음 한 문장으로 요약할 수 있습니다.

**전역 하나를 모두가 같이 잡는 것보다, 각 셀은 자기 store를 갖고 공통 데이터는 API/모듈처럼 공유하는 것이 더 안전합니다.**

## 먼저 결론부터

### 하지 말아야 할 기본값

- 모든 셀이 직접 만지는 giant global store
- shared store shape에 모두 의존하는 구조
- 셀 내부 UI state까지 공용 store에 올리는 구조

### 안전한 기본값

- 셀 내부 상태 -> 셀 내부 store
- 공통 조회 데이터 -> shared service/module
- 앱 간 동기화 -> URL 또는 서버 재조회 우선
- 이벤트/구독 -> 정말 필요한 경우에만 보조 수단

## 왜 global store가 위험한가

처음에는 전역 store가 편해 보입니다.

예:

```ts
export const globalStore = {
  user: null,
  kycStep: null,
  cart: null,
};
```

하지만 이 구조는 빠르게 문제를 만듭니다.

### 1. 값의 주인이 불명확해진다

- 누가 바꿨는지 추적이 어려움
- 어느 앱이 책임지는지 흐려짐

### 2. 셀끼리 강하게 묶인다

- 한 셀이 `user.ci`를 기대
- 다른 셀이 `user.userId` 로 구조 변경
- 독립 배포가 어려워짐

### 3. 사실상 다시 모놀리스가 된다

파일은 나뉘어도 상태 트리는 하나이기 때문에, 실질적으로는 거대한 공유 상태 구조가 됩니다.

## store 공유 대신 module 공유가 더 좋은 이유

여기서 핵심은:

> 상태값 자체를 같이 들고 있지 말고, 상태를 얻는 방법과 공통 기능만 계약된 API로 공유하자

예:

```ts
// @platform/auth
export async function getCurrentUser() {
  const response = await fetch('/api/me');
  return response.json();
}

export function isLoggedIn(user: { id?: string } | null) {
  return !!user?.id;
}
```

이 방식의 장점:

- 내부 저장 방식 숨김 가능
- 캐시 전략 변경 가능
- 구현 교체 가능
- store shape를 외부에 강제하지 않음

쉽게 말하면:

- store 공유 = 모두가 같은 냉장고를 뒤지는 방식
- module 공유 = 자판기처럼 정해진 버튼만 누르는 방식

MFA에서는 두 번째가 훨씬 안전합니다.

## Zustand를 안전하게 쓰는 패턴

Zustand는 React 전용 hook store뿐 아니라 **vanilla store** 도 제공하기 때문에, 공유 모듈을 만들 때 유리합니다.

vanilla store는 보통 아래 API를 제공합니다.

- `getState`
- `setState`
- `getInitialState`
- `subscribe`

### 피하고 싶은 구조

```ts
// ❌ 모든 셀이 직접 import 해서 쓰는 글로벌 store
import { create } from 'zustand';

export const useGlobalStore = create(() => ({
  user: null,
  kycStep: 'start',
  cart: null,
}));
```

문제:

- 진짜 공용 상태와 로컬 UI 상태의 경계가 흐려짐
- store shape 변경이 전체에 영향
- Module Federation 환경이면 singleton/중복 로딩 문제까지 생김

### 추천 구조: private store + public API module

```ts
// shared/session/session.store.ts
import { createStore } from 'zustand/vanilla';

type User = {
  id: string;
  name: string;
  ci?: string;
};

type SessionState = {
  user: User | null;
  hydrated: boolean;
};

export const sessionStore = createStore<SessionState>(() => ({
  user: null,
  hydrated: false,
}));
```

```ts
// shared/session/index.ts
import { sessionStore } from './session.store';

export async function hydrateSession() {
  if (sessionStore.getState().hydrated) return;

  const user = await fetch('/api/me').then((r) => r.json());

  sessionStore.setState({
    user,
    hydrated: true,
  });
}

export function getCurrentUser() {
  return sessionStore.getState().user;
}

export function subscribeCurrentUser(listener: (user: unknown) => void) {
  return sessionStore.subscribe((state) => listener(state.user));
}
```

핵심:

- store 객체 자체는 숨깁니다
- 외부 셀은 `hydrateSession`, `getCurrentUser`, `subscribeCurrentUser` 같은 API만 압니다
- 내부 구현이 Zustand인지, 다른 캐시인지 외부는 몰라도 됩니다

### React 셀에서 사용하는 예

```ts
import { hydrateSession, getCurrentUser } from '@shared/session';

export async function initKycApp() {
  await hydrateSession();

  const user = getCurrentUser();

  if (!user) {
    return { type: 'routeMove', path: '/login' as const };
  }

  return { type: 'ready' as const };
}
```

중요한 점:

KYC 셀은 shared store의 shape를 직접 알 필요가 없습니다.

## Zustand에서 정말 공용 런타임 store가 필요하다면

기술적으로는 가능합니다.

예:

- 같은 window/runtime 안에서
- shared module이 singleton처럼 동작하고
- Module Federation shared 설정이 안정적으로 잡혀 있는 경우

하지만 기본값으로 추천하지는 않습니다.

이유:

- 런타임 인스턴스 보장
- 버전 호환
- shared public API 안정성

이 세 가지를 모두 관리해야 하기 때문입니다.

## Pinia를 안전하게 쓰는 패턴

Pinia는 app에 주입된 **Pinia 인스턴스** 를 기준으로 동작합니다.

즉:

- 셀마다 Vue app이 따로 뜨면
- Pinia 인스턴스도 따로 생길 수 있고
- 이름이 같은 store라도 같은 store가 아닐 수 있습니다

## Pinia에서 피하고 싶은 구조

```ts
// ❌ shell도 createPinia()
// ❌ kyc 앱도 createPinia()
// ❌ checkout 앱도 createPinia()
// ❌ 그리고 모두가 같은 전역 store라고 믿는 구조
```

이렇게 되면 `useUserStore()` 라는 이름이 같아도 실제로는 서로 다른 Pinia 세계의 store일 수 있습니다.

## 추천 구조 A: 셀별 Pinia는 로컬 상태용

```ts
// apps/kyc/src/app/pinia.ts
import { createPinia } from 'pinia';

export const pinia = createPinia();
```

```ts
// apps/kyc/src/stores/useKycFlowStore.ts
import { defineStore } from 'pinia';

export const useKycFlowStore = defineStore('kyc-flow', {
  state: () => ({
    step: 'start' as 'start' | 'id-card' | 'account' | 'done',
    idType: null as string | null,
    loading: false,
  }),
  actions: {
    moveNext(next: 'id-card' | 'account' | 'done') {
      this.step = next;
    },
  },
});
```

이 store는 KYC 셀 내부 상태 전용입니다.

좋은 예:

- 현재 step
- 입력 중인 값
- 로딩/에러 상태
- 화면 orchestration

## 추천 구조 B: 공통 데이터는 Pinia store가 아니라 service module

```ts
// shared/session/sessionService.ts
let cachedUser: unknown = null;

export async function getCurrentUser() {
  if (cachedUser) return cachedUser;
  cachedUser = await fetch('/api/me').then((r) => r.json());
  return cachedUser;
}
```

```ts
// apps/kyc/src/stores/useKycBootstrapStore.ts
import { defineStore } from 'pinia';
import { getCurrentUser } from '@shared/session/sessionService';

export const useKycBootstrapStore = defineStore('kyc-bootstrap', {
  state: () => ({
    ready: false,
    user: null as unknown,
  }),
  actions: {
    async init() {
      this.user = await getCurrentUser();
      this.ready = true;
    },
  },
});
```

핵심:

- 공통 원본 데이터 접근은 service module
- Pinia는 셀 내부 view-model / orchestration 용도

## Pinia에서 subscribe를 쓸 때 주의할 점

Pinia의 `$subscribe()` 는 유용하지만, 기본적으로는 컴포넌트 lifecycle에 묶입니다.

즉:

- 셀 내부의 UI 반응용으로는 좋음
- 장기 cross-cell 이벤트 버스로 쓰려면 lifecycle 관리가 필요함

`{ detached: true }` 옵션을 주면 언마운트 이후에도 유지할 수 있지만, 그만큼 명시적 관리가 필요합니다.

## Zustand vs Pinia를 어떻게 나누면 좋나

### Zustand가 잘 맞는 경우

- React 셀이 많다
- framework-neutral shared module을 만들고 싶다
- vanilla store + public API 패턴이 잘 맞는다

### Pinia가 잘 맞는 경우

- Vue 셀이 중심이다
- 셀 내부 상태를 구조적으로 관리하고 싶다
- state/getters/actions 모델이 잘 맞는다

다만 Pinia store 간 조합에서는 순환 참조에 주의해야 합니다.

## 가장 실무적인 추천 구조

### 1. 셀 내부 상태

- React 셀 -> Zustand local store
- Vue 셀 -> Pinia local store

### 2. 공통 데이터

- `shared/session`
- `shared/auth`
- `shared/featureFlags`
- `shared/config`

이런 식의 공유 service/module 로 노출

### 3. 셀 간 동기화

- 가능하면 URL
- 아니면 서버 재조회 / invalidate
- 정말 필요하면 제한된 subscribe/event

### 4. 기본값으로 두지 않을 것

- giant global store
- 공용 store shape에 대한 강한 의존
- 셀 내부 UI state를 공유 store에 올리는 구조

## 아주 짧은 판단 기준

### A. 셀 내부 UI 상태

예:

- step
- modal
- loading
- form value

-> 셀 로컬 Zustand / Pinia

### B. 여러 셀이 필요로 하는 조회 데이터

예:

- 현재 사용자
- 권한
- feature flag

-> 공유 module + 내부 cache

### C. 여러 셀이 실시간으로 같이 바뀌어야 하는 값

-> 먼저 "정말 실시간 공유가 필요한가?" 를 의심

-> 가능하면 서버 재조회 / invalidate

-> 꼭 필요하면 제한된 subscribe/event

### D. 앱 전체 giant global state

-> 거의 항상 피하는 쪽이 맞음

## 한 문장 정리

**MFA에서 Zustand / Pinia를 안전하게 쓰는 방법은 "전역 하나를 다 같이 잡는 것"이 아니라, "각 셀은 자기 store를 갖고 공통 데이터는 store가 아니라 API 모듈처럼 공유하는 것"입니다.**
