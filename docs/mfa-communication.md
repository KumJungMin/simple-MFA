# 앱 간 데이터 공유와 통신

MFA에서 가장 중요한 감각 중 하나는 이것입니다.

**앱 간 통신 기술이 화려한 구조가 좋은 구조가 아니라, 앱 간 통신이 많이 필요 없도록 경계를 잘 자른 구조가 좋은 구조입니다.**

그 전제 위에서, 데이터 공유는 아래 우선순위로 생각하면 안전합니다.

## 우선순위 1: URL을 계약으로 써라

앱 A가 앱 B에게 "이 상태로 저 화면을 열어줘" 라고 말해야 한다면, 가장 먼저 고려할 수단은 URL입니다.

예:

- `/checkout?cartId=123`
- `/orders/123/payment`

장점:

- 디버깅이 쉽습니다
- 북마크/딥링크가 됩니다
- 앱 간 결합도가 낮습니다
- 배포 독립성을 해치지 않습니다

즉:

**페이지 전환이 개입된 상태 전달은 URL이 1순위** 입니다.

## 우선순위 2: 공통 로직은 상태 공유가 아니라 모듈 공유로 푼다

다음 같은 것은 전역 store보다는 utility module로 공유하는 편이 안전합니다.

- auth
- 현재 사용자 조회
- 권한 체크
- feature flags
- 공통 fetch wrapper
- 환경설정
- 디자인 시스템
- 에러 처리

예:

```ts
// @platform/auth
export async function getCurrentUser(): Promise<User> {
  const response = await fetch('/api/me');
  return response.json();
}

export function userCanAccess(permission: string): boolean {
  // ...
  return true;
}
```

이 방식이 좋은 이유:

- 내부 구현을 숨길 수 있습니다
- store shape 공유를 강제하지 않습니다
- 캐시 추가가 쉽습니다
- 나중에 구현을 바꿔도 public API만 유지하면 됩니다

즉:

**값 자체를 공유하는 대신, 값을 얻는 방법을 공유** 하는 것입니다.

## 우선순위 3: API 데이터 공유는 shared API utility + cache 정도로

여러 앱이 읽는 조회성 데이터는 공유 utility에서 다루는 것이 좋습니다.

예:

- 현재 로그인 사용자
- cart summary
- 권한 목록

패턴:

- `@platform/api` 나 `@platform/session` 같은 모듈이 조회 함수를 노출
- 내부적으로 in-memory cache를 둘 수 있음
- source of truth는 여전히 백엔드

중요:

프런트 앱끼리의 메모리 상태를 정본처럼 다루기 시작하면 동기화 문제가 커집니다.

즉, 프런트 간 공유는 보통 **조회 편의용 캐시** 정도로 보는 것이 안전합니다.

## 우선순위 4: UI 상태는 되도록 공유하지 않는다

가장 위험한 공유 대상은 UI state 입니다.

예:

- modal 열림 여부
- 현재 input 값
- 현재 탭
- hover 상태

이런 상태를 여러 앱이 자주 주고받아야 한다면, 경계가 잘못됐을 가능성이 큽니다.

정리:

- 도메인 이동/의도 전달 -> URL
- 공통 로직/정책 -> utility module
- 공통 조회 데이터 -> shared API utility + cache
- 실시간 UI 상태 -> 정말 드물게만 이벤트
- UI state를 자주 공유해야 함 -> 경계 재설계

## 이벤트 기반 통신은 언제 쓰나

이벤트 기반 통신은 "가능하다"와 "기본값이어야 한다"가 다릅니다.

결론부터 말하면:

- 가능하다
- 하지만 기본값으로 쓰면 안 된다

## CustomEvent

같은 페이지/같은 앱 컨텍스트 안의 느슨한 알림에는 꽤 유용합니다.

예:

- cart 변경 후 shell badge 갱신
- KYC 완료 후 상단 배너 갱신
- toast 표시

예시:

```ts
window.dispatchEvent(
  new CustomEvent('cart:changed', {
    detail: { count: 3 },
  })
);
```

하지만 주의점이 큽니다.

- 이벤트 이름이 문자열이라 오타에 약함
- 누가 이 이벤트를 듣는지 추적이 어렵다
- listener가 없으면 그냥 사라진다
- 핵심 비즈니스 플로우를 이벤트에 기대기 시작하면 디버깅이 어려워진다

그래서 적합한 용도는:

- 알림성 신호
- badge 갱신
- analytics 트리거
- 느슨한 UI 동기화

적합하지 않은 용도는:

- 결제/인증의 핵심 분기
- 다음 페이지 이동 결정
- 정본 상태 전달

### CustomEvent를 조금 더 안전하게 쓰는 방법

이벤트 이름과 payload 타입을 래퍼로 감싸는 편이 좋습니다.

```ts
type AppEvents = {
  'kyc:completed': { userId: string };
  'cart:changed': { count: number };
};

export function emit<K extends keyof AppEvents>(name: K, payload: AppEvents[K]) {
  window.dispatchEvent(new CustomEvent(name, { detail: payload }));
}
```

그래도 여전히 **핵심 도메인 흐름의 기본 수단** 으로 삼지는 않는 편이 좋습니다.

## BroadcastChannel

같은 origin의 탭/iframe/worker 사이 통신에 유용합니다.

특징:

- 같은 origin 컨텍스트 간 publish/subscribe 느낌으로 사용 가능
- 다른 탭/iframe에도 메시지 전달 가능

주의점:

- same-origin이어야 합니다
- 브라우저 컨텍스트 간 알림에는 좋지만, 정본 상태 관리 도구는 아닙니다

## postMessage

cross-origin iframe/popup/window 통신의 대표적인 수단입니다.

특징:

- 서로 다른 origin window 간 통신 가능
- 보안상 `targetOrigin` 관리가 중요함

언제 주로 쓰나:

- iframe 통합
- popup 인증
- 외부 시스템 임베딩

## localStorage의 storage 이벤트

가능은 하지만 주요 이벤트 버스로는 추천하지 않는 편이 좋습니다.

이유:

- 값을 변경한 같은 창에는 이벤트가 발생하지 않습니다
- 다른 문서에서만 반응합니다
- 의미가 미묘하고 디버깅이 불편합니다

괜찮은 용도:

- 단순 탭 간 로그아웃 동기화

피하고 싶은 용도:

- 복잡한 앱 간 이벤트 버스

## 글로벌 store를 왜 조심해야 하나

여러 앱이 하나의 전역 store를 직접 같이 쓰기 시작하면 다음 문제가 생깁니다.

- store shape 변경이 여러 앱에 동시에 영향
- 누가 상태를 바꿨는지 추적 어려움
- 독립 배포 약화
- 사실상 보이지 않는 lockstep release

즉:

**전역 store를 공유하는 순간, 구조는 나뉘어도 상태는 다시 하나의 모놀리스처럼 묶이기 쉽습니다.**

## 디자인 시스템과 공통 UI는 어떻게 볼까

공통 UI는 utility module 후보입니다.

예:

- design tokens
- styleguide
- button/input 같은 base component
- typography/spacing rules

하지만 원칙이 있습니다.

**자주 함께 바뀌어야 하는 것만 공통화** 해야 합니다.

셀 특화 UI까지 모두 design system으로 끌어올리면, design system이 새로운 모놀리스가 됩니다.

## 최종 우선순위

1. 페이지 이동/의도 전달 -> URL
2. 공통 정책/공통 로직 -> utility module
3. 공통 조회 데이터 -> shared API utility + cache
4. 느슨한 알림 -> 이벤트
5. 실시간 UI state를 자주 공유해야 함 -> 경계 다시 설계

## 한 문장 정리

**MFA에서 앱 간 공유의 기본값은 "store 공유"가 아니라 "계약(URL/API)과 모듈 공유"입니다.**
