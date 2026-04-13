# 셸이 앱을 붙이는 방식 설명서

이 문서는 마이크로 프론트엔드에서 **셸(shell)이 도메인 앱을 어떻게 화면에 붙이는지**를 처음 보는 사람도 이해할 수 있게 차근차근 설명하는 가이드입니다.

이 저장소의 현재 구현도 함께 다룹니다. 결론부터 말하면, **현재 코드는 셸이 remote 스크립트를 로드하고, 그 스크립트가 등록한 custom element를 셸이 렌더링하는 방식**입니다.

## 1. 먼저 큰 그림부터 이해하기

마이크로 프론트엔드에서 자주 나오는 질문이 있습니다.

- 셸이 앱을 붙인다는 게 무슨 뜻인가?
- 셸이 다른 앱의 컴포넌트를 직접 import 한다는 뜻인가?
- iframe처럼 페이지를 끼워 넣는 건가?
- 브라우저는 어떻게 다른 프레임워크 앱을 한 화면에 보여줄 수 있나?

핵심은 생각보다 단순합니다.

**셸은 "이 페이지에서 어떤 앱을 보여줄지 결정하는 상위 오케스트레이터"이고, 도메인 앱은 "자기 UI와 기능을 실제로 렌더링하는 주체"입니다.**

즉, 셸은 보통 이런 일을 합니다.

- 현재 URL을 본다
- 인증이나 공통 레이아웃을 처리한다
- 필요한 앱을 로드한다
- 앱이 붙을 자리를 만든다

도메인 앱은 보통 이런 일을 합니다.

- 자기 화면을 렌더링한다
- 자기 API를 호출한다
- 자기 상태를 관리한다
- 자기 DOM 영역을 책임진다

## 1-1. 용어 먼저: cell과 shell은 다르다

처음 들으면 `cell`과 `shell`이 비슷하게 들려서 많이 헷갈립니다.

- `shell`
  - 상위 레이아웃, 공통 라우팅, remote 로딩을 담당하는 오케스트레이터
- `cell`
  - 보통 실무에서 쓰는 vertical slice, 즉 기능 단위 도메인 영역

현재 저장소에서 **앱을 실제로 붙이는 주체는 `cell`이 아니라 `shell-react`** 입니다.

즉, 질문을 더 정확히 바꾸면 이렇게 됩니다.

> 셸이 도메인 앱을 어떻게 붙이느냐?

이 문서도 그 기준으로 설명합니다.

## 2. 이 저장소에서 "붙인다"는 건 정확히 무슨 뜻인가

이 저장소는 `MPA + micro frontend`가 같이 들어 있습니다.

구분해서 보면:

- `MPA` 부분
  - 셸이 `/`와 `/kyc.html` 같은 **실제 페이지**를 소유합니다.
  - 페이지를 이동하면 브라우저가 새 문서를 다시 로드합니다.
- `micro frontend 조합` 부분
  - `/kyc.html` 안에서 셸이 Vue KYC 앱을 **remote로 로드**해서 페이지 안에 붙입니다.

즉, 이 구조는 "페이지 이동은 MPA", "도메인 UI 조합은 마이크로 프론트엔드"입니다.

## 3. 현재 코드 흐름: 실제로 무슨 일이 일어나나

현재 KYC 페이지의 흐름을 아주 단순화하면 아래와 같습니다.

```text
1. 사용자가 /kyc.html 에 들어온다
2. shell React 페이지가 렌더링된다
3. shell이 remote entry script를 로드한다
4. remote script가 <mfe-kyc-app> custom element를 등록한다
5. shell이 <mfe-kyc-app token="..." api-base="/api"> 를 렌더링한다
6. 브라우저가 그 태그를 실제 custom element로 승격한다
7. Vue KYC 앱이 그 안에서 렌더링된다
8. KYC 앱이 /api/kyc/status, /api/kyc/complete 를 호출한다
```

이걸 파일 기준으로 따라가 보면 더 명확합니다.

### 3-1. 셸 페이지가 먼저 뜬다

KYC 페이지는 셸이 소유합니다.

- [`apps/shell-react/src/KycPage.tsx`](../../apps/shell-react/src/KycPage.tsx)

이 파일에서 셸은 다음 일을 합니다.

- remote URL을 확인한다
- remote 스크립트를 로드한다
- 로딩 성공 시 `<mfe-kyc-app />` 태그를 렌더링한다

핵심 부분은 이런 흐름입니다.

```tsx
await loadRemoteModule(runtime.kycRemoteUrl);
setStatus('ready');

<mfe-kyc-app token={runtime.token} api-base={runtime.apiBase} />
```

즉, 셸이 Vue 컴포넌트를 직접 import 한 게 아니라, **먼저 remote를 불러오고, 그 다음 custom element 태그를 화면에 그리는 것**입니다.

### 3-2. 셸은 remote 스크립트를 동적으로 로드한다

- [`apps/shell-react/src/lib/load-remote.ts`](../../apps/shell-react/src/lib/load-remote.ts)

이 파일은 `script type="module"` 태그를 동적으로 만들어 `document.head`에 추가합니다.

```ts
const script = document.createElement('script');
script.type = 'module';
script.src = remoteUrl;
document.head.appendChild(script);
```

이 단계의 의미는:

- "지금부터 저 URL의 자바스크립트를 브라우저에 로드해"
- "그 스크립트가 어떤 컴포넌트나 custom element를 등록하겠지"

라는 뜻입니다.

중요한 점은 셸이 remote 내부 구현을 몰라도 된다는 것입니다. 셸은 그냥 **"저 스크립트를 로드하면 `mfe-kyc-app`이 준비될 것"** 이라는 계약만 믿습니다.

### 3-3. remote 스크립트가 custom element를 등록한다

- [`apps/kyc-vue/src/remote.ts`](../../apps/kyc-vue/src/remote.ts)

여기서는 Vue의 `defineCustomElement()`를 이용해서 `mfe-kyc-app`을 등록합니다.

```ts
const elementName = 'mfe-kyc-app';

if (!customElements.get(elementName)) {
  customElements.define(elementName, defineCustomElement(KycRemoteElement));
}
```

이 줄의 의미를 쉬운 말로 바꾸면:

> 브라우저야, 이제부터 `<mfe-kyc-app>`이라는 태그를 만나면
> 이 Vue 컴포넌트로 동작하게 해줘.

즉, custom element는 "브라우저가 이해할 수 있게 등록된 새로운 HTML 태그"라고 보면 됩니다.

### 3-4. custom element 안에서 실제 Vue 앱이 렌더링된다

- [`apps/kyc-vue/src/KycRemote.ce.vue`](../../apps/kyc-vue/src/KycRemote.ce.vue)
- [`apps/kyc-vue/src/components/KycPanel.vue`](../../apps/kyc-vue/src/components/KycPanel.vue)

`KycRemote.ce.vue`는 셸이 넘긴 props를 받아서 실제 KYC UI 컴포넌트인 `KycPanel`에 전달합니다.

```vue
<KycPanel :api-base="props.apiBase" :token="props.token" embedded />
```

즉, 셸은:

- `token`
- `api-base`

같은 상위 컨텍스트를 넘기고,

KYC 앱은:

- 그 값을 바탕으로 API를 호출하고
- 자기 UI를 렌더링하고
- 자기 상태를 유지합니다

## 4. 그래서 질문에 대한 짧은 답은 무엇인가

질문:

> 셀에서 앱 불러올 때 customElements를 불러와서 렌더링하는 거네?

현재 저장소 기준으로는 **맞습니다.**

좀 더 정확히 말하면:

1. 셸이 remote 스크립트를 로드한다
2. remote 스크립트가 `customElements.define()`를 실행한다
3. 셸이 `<mfe-kyc-app>` 태그를 렌더링한다
4. 브라우저가 그 태그를 실제 앱처럼 동작시키도록 연결한다

다만 이것은 **여러 조합 방식 중 하나**입니다.

## 5. 셸이 앱을 붙이는 방식은 꼭 custom element뿐일까

아닙니다. 마이크로 프론트엔드에서 셸이 앱을 붙이는 방식은 여러 가지가 있습니다.

이걸 이해할 때는 아래 두 질문을 분리해서 보면 좋습니다.

1. **어떤 시점에 앱을 로드할 것인가**
2. **로드한 앱을 어떤 방식으로 화면에 붙일 것인가**

`custom element`는 그중 하나일 뿐입니다.

## 6. 대표적인 조합 방식들

### 6-1. 방식 A: Custom Elements / Web Components

현재 저장소가 쓰는 방식입니다.

흐름:

```text
Shell
  -> remote script 로드
  -> customElements.define('mfe-kyc-app', ...)
  -> <mfe-kyc-app> 렌더
  -> 브라우저가 해당 태그를 앱으로 동작시킴
```

장점:

- 프레임워크 경계를 비교적 깔끔하게 만들 수 있음
- React 셸 안에 Vue 앱을 붙이기 쉬움
- 셸은 태그와 props 계약만 알면 됨

주의할 점:

- custom element 속성/이벤트 계약을 명확히 정해야 함
- 스타일 격리 전략을 따로 생각해야 함
- 앱 unmount/cleanup 타이밍을 설계해야 함

이 방식은 특히 **프레임워크가 다른 앱을 붙일 때** 이해하기 쉽습니다.

### 6-2. 방식 B: mount/unmount API를 export하는 방식

이 방식은 remote가 custom element를 등록하지 않고, 대신 `mount()`와 `unmount()` 같은 함수를 공개합니다.

예시 개념:

```ts
// remote entry
export function mount(container: HTMLElement, props: AppProps) {
  // container 안에 앱 렌더링
}

export function unmount() {
  // cleanup
}
```

셸은 이렇게 사용합니다.

```ts
const remote = await importRemoteSomehow();
remote.mount(containerElement, { token, apiBase });
```

장점:

- mount/unmount lifecycle이 더 명시적임
- 셸이 어느 DOM 노드에 붙일지 직접 제어 가능
- React, Vue, Svelte 등 여러 앱에서 자주 쓰는 패턴

주의할 점:

- 셸이 lifecycle을 더 많이 알아야 함
- custom element보다 DOM 조합이 조금 더 저수준임

이 방식은 **single-spa 계열 사고방식**과 잘 맞습니다. 셸이 어느 앱을 언제 mount/unmount 할지 더 직접적으로 관리할 수 있기 때문입니다.

### 6-3. 방식 C: Module Federation으로 컴포넌트 import

셸이 remote 컴포넌트를 직접 import 해서 렌더링하는 방식입니다.

예시 개념:

```tsx
const RemoteKycApp = React.lazy(() => import('kyc/App'));

<RemoteKycApp token={token} apiBase={apiBase} />
```

장점:

- React 개발자에게 가장 익숙하게 느껴질 수 있음
- 일반 컴포넌트처럼 조합 가능
- shared dependency 전략과 함께 쓰기 쉬움

주의할 점:

- host와 remote의 빌드/런타임 계약 관리가 필요함
- shared dependency 버전 정책이 중요함
- 프레임워크가 다르면 custom element보다 경계가 덜 자연스러울 수 있음

이 방식은 **같은 프레임워크 기반 앱들**에서 많이 선택합니다.

### 6-4. 방식 D: iframe

셸이 앱을 iframe으로 끼워 넣는 방식입니다.

흐름:

```html
<iframe src="/kyc-app" />
```

장점:

- 격리가 매우 강함
- CSS/JS 전역 충돌이 적음
- 레거시 시스템을 임시 통합하기 쉬움

주의할 점:

- UX가 분리되기 쉬움
- 높이 조절, 라우팅, 인증 연동이 번거로움
- cross-origin이면 `postMessage` 같은 별도 통신이 필요함

이 방식은 일반적인 주력 조합보다는 **외부 시스템 임베드**나 **강한 격리**가 필요할 때 더 적합합니다.

### 6-5. 방식 E: 앱을 페이지 단위로만 넘기는 MPA 방식

이 경우 셸이 앱을 같은 페이지 안에 붙이지 않고, 아예 **다른 페이지로 이동**시킵니다.

예시:

- `/checkout`은 checkout 앱이 소유
- `/kyc`는 kyc 앱이 소유
- 셸은 상위 네비게이션과 링크만 담당

장점:

- 경계가 명확함
- 앱 간 DOM 충돌이 적음
- 독립성이 높음

주의할 점:

- 한 페이지 안에서 여러 앱을 함께 보여주는 조합은 어려움
- 페이지 간 상태 전달은 URL, 세션, 서버 재조회 같은 계약에 더 의존함

이건 "붙인다"기보다는 **페이지 ownership을 넘긴다**에 더 가깝습니다.

## 7. 현재 저장소는 어떤 방식의 조합인가

현재 저장소는 하나만 쓰는 게 아니라 **두 층의 조합**을 같이 씁니다.

### 층 1. 페이지 수준

셸이 `/`와 `/kyc.html`를 소유합니다.

이건 **MPA 관점의 조합**입니다.

### 층 2. 페이지 내부 수준

`/kyc.html` 안에서는 셸이 Vue KYC 앱을 custom element 방식으로 붙입니다.

이건 **micro frontend runtime composition**입니다.

즉, 이 저장소는 이렇게 이해하면 됩니다.

```text
Page ownership: shell
Page transition: MPA
In-page composition: custom element based micro frontend
```

## 8. 셸이 앱을 붙일 때 반드시 정해야 하는 것

조합 방식이 무엇이든, 아래 질문에는 답이 있어야 합니다.

### 8-1. 누가 페이지를 소유하나

예:

- `/kyc.html`는 셸 소유인가?
- 아니면 KYC 앱이 자체 페이지를 소유하나?

페이지 ownership이 모호하면 라우팅, SEO, 인증 흐름이 꼬이기 쉽습니다.

### 8-2. 누가 DOM 영역을 소유하나

예:

- 셸은 헤더/레이아웃까지만 책임지는가?
- KYC 앱은 자기 mount root 내부만 건드리는가?

실무에서는 **자기 DOM은 자기가 책임진다**는 원칙이 중요합니다.

### 8-3. 어떤 데이터를 어떻게 넘길 건가

예:

- `token`
- `locale`
- `apiBase`
- `channel`

이런 값은 보통 아래 중 하나로 넘깁니다.

- URL
- props/attributes
- shared module
- 서버 세션

현재 저장소는 `token`, `api-base`를 custom element props/attributes로 넘깁니다.

### 8-4. 로딩 실패 시 어떻게 보일 건가

remote는 네트워크 실패가 날 수 있으므로:

- 로딩 중 UI
- 실패 UI
- 재시도 전략

이 있어야 합니다.

현재도 [`apps/shell-react/src/KycPage.tsx`](../../apps/shell-react/src/KycPage.tsx)에서 `loading / ready / error` 상태를 두고 있습니다.

### 8-5. 인증과 API 호출은 누가 책임지나

셸이 상위 인증만 보고, 실제 KYC 앱은 자기 API를 직접 호출할 수도 있습니다.

중요한 건 **책임 분리**입니다.

- 셸: 상위 진입 제어
- 도메인 앱: 자기 기능 API 호출

현재 저장소도 이 방향에 가깝습니다.

### 8-6. 스타일 충돌은 어떻게 막을 건가

서로 다른 앱이 한 페이지에 섞이면:

- 전역 CSS 충돌
- reset 충돌
- class name 충돌

이 생길 수 있습니다.

custom element를 쓰더라도 스타일 격리가 자동으로 완벽히 해결되는 것은 아닙니다. Shadow DOM 사용 여부, 전역 CSS 사용 방식, 디자인 시스템 경계를 같이 정해야 합니다.

### 8-7. unmount와 cleanup은 어떻게 할 건가

한 번 붙인 앱이 사라질 때:

- 이벤트 리스너 해제
- interval 정리
- subscription 해제

같은 cleanup이 필요합니다.

custom element 방식에서는 element lifecycle과 앱 내부 cleanup을 같이 고려해야 합니다.

## 9. 처음 보는 사람이 가장 많이 헷갈리는 포인트

### 오해 1. 셸이 앱을 붙인다는 건 다른 앱 코드를 다 가져와서 직접 제어한다는 뜻이다

꼭 그렇지는 않습니다.

셸이 아는 것은 보통:

- remote 위치
- public contract
- mount 방법

정도입니다.

즉, 셸은 **오케스트레이션**을 하고, 앱 내부 구현은 몰라도 되는 구조가 이상적입니다.

### 오해 2. custom element를 쓰면 무조건 마이크로 프론트엔드다

아닙니다.

custom element는 조합 기술일 뿐입니다. 진짜 중요한 것은:

- 독립 개발
- 독립 배포
- 경계 설계
- ownership 분리

입니다.

### 오해 3. 앱을 붙이려면 반드시 한 페이지 안에서 합쳐야 한다

아닙니다.

어떤 경우에는 **페이지 전환만으로도 충분히 좋은 마이크로 프론트엔드 구조**가 됩니다. 오히려 그 편이 더 단순하고 안정적인 경우도 많습니다.

## 10. 처음 도입할 때 추천하는 안전한 선택

처음 시작한다면 보통 아래 순서를 추천할 수 있습니다.

1. 먼저 페이지 ownership을 나눈다
2. 셸은 얇게 유지한다
3. 도메인 앱은 자기 DOM과 상태를 스스로 책임지게 한다
4. 앱 간 전달은 URL이나 명시적 props부터 시작한다
5. 한 페이지 안 조합이 꼭 필요할 때만 custom element나 mount API를 도입한다

즉, "붙이는 기술"보다 먼저 **"누가 무엇을 책임지는지"** 를 정하는 것이 더 중요합니다.

## 11. 현재 저장소를 기준으로 한 한 줄 요약

이 저장소에서는:

**셸이 KYC 페이지를 소유하고, remote 스크립트를 로드한 뒤, 그 스크립트가 등록한 `<mfe-kyc-app>` custom element를 렌더링해서 Vue 도메인 앱을 붙입니다.**

## 12. 방식별 비교표

| 방식 | 셸이 하는 일 | 앱이 노출하는 것 | 잘 맞는 상황 | 주의점 |
| --- | --- | --- | --- | --- |
| Custom element | 스크립트 로드 후 태그 렌더링 | HTML 태그 + 속성/이벤트 계약 | 프레임워크가 다를 때, 태그 기반 조합이 쉬울 때 | lifecycle, 스타일, 이벤트 계약 관리 |
| mount/unmount API | 컨테이너 DOM을 만들고 mount 호출 | `mount()`, `unmount()` 함수 | 앱 lifecycle을 셸이 더 명시적으로 관리할 때 | 셸이 저수준 제어를 더 많이 알아야 함 |
| Module Federation import | remote 컴포넌트를 직접 import 해서 렌더링 | 컴포넌트/모듈 | 같은 프레임워크에서 자연스럽게 조합할 때 | shared dependency 버전 정책 중요 |
| iframe | iframe src 연결 | 별도 페이지/앱 | 외부 시스템 임베드, 강한 격리 | UX와 통신이 번거로움 |
| MPA route handoff | 링크/페이지 이동 | 페이지 자체 | 경계를 강하게 분리하고 싶을 때 | 한 페이지 안 조합은 제한적 |

## 13. 마지막 정리

처음 보는 사람이라면 이 세 줄만 먼저 기억해도 충분합니다.

- 셸은 "어디에 무엇을 보여줄지"를 결정하는 오케스트레이터다
- 도메인 앱은 "자기 화면과 기능"을 실제로 렌더링하는 주체다
- 현재 저장소에서는 셸이 remote를 로드하고, remote가 등록한 custom element를 셸이 렌더링하는 방식으로 앱을 붙인다

그리고 한 줄 더 덧붙이면:

**마이크로 프론트엔드의 핵심은 앱을 붙이는 기술 자체보다, 셸과 앱의 책임 경계를 안정적으로 나누는 설계입니다.**
