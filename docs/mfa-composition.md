# 조합 방식과 로딩 기술

MFA에서 "앱을 연결한다"는 말은 사실 두 가지를 동시에 뜻합니다.

- 화면을 어떻게 조립할 것인가
- 코드/모듈을 어떻게 로딩할 것인가

이 둘은 비슷해 보이지만 다른 문제입니다.

## 가장 무난한 시작점: Shell + Route 기반 런타임 조합

처음 시작하는 팀에게 가장 이해하기 쉬운 방식은 **shell이 현재 URL을 보고 필요한 앱을 runtime에 로드하고 mount 하는 방식** 입니다.

이 방식이 좋은 이유:

- route-based split과 잘 맞습니다
- 독립 배포와 잘 맞습니다
- 사용자의 이동 경로를 설명하기 쉽습니다
- SSR이 꼭 필요 없는 경우 시작이 단순합니다

## 조합 방식별 비교

### 1. Runtime JavaScript Composition

의미:

- container/shell이 현재 상황에 맞는 micro app을 런타임에 로드합니다

장점:

- 유연합니다
- 독립 배포와 잘 맞습니다
- route 기반 분리와 궁합이 좋습니다

주의점:

- 로딩 실패 처리가 필요합니다
- 공통 의존성 전략을 잘 정해야 합니다

### 2. Server-side Composition

의미:

- 서버가 HTML fragment 또는 조각 결과물을 먼저 합쳐서 내려줍니다

장점:

- 초기 렌더 통제력이 좋습니다
- SSR/SEO에 유리할 수 있습니다

주의점:

- 서버 조합 계층이 복잡해집니다
- fragment 간 계약 관리가 중요해집니다

### 3. Web Components 기반 조합

의미:

- 각 앱이 custom element를 노출하고 shell이 그 태그를 렌더합니다

장점:

- 프레임워크 경계를 넘기 쉽습니다
- DOM 경계를 비교적 명확하게 나눌 수 있습니다

주의점:

- custom element lifecycle 이해가 필요합니다
- SSR이나 스타일 처리에서 별도 전략이 필요할 수 있습니다

### 4. iframe

의미:

- 앱을 브라우저 레벨 격리 컨테이너 안에 넣습니다

장점:

- 격리가 강합니다
- 전역 변수/스타일 충돌이 적습니다

주의점:

- UX가 쉽게 끊깁니다
- 라우팅/인증/상태 공유가 더 어렵습니다
- cross-origin이면 `postMessage()`가 거의 필수입니다

실무적으로는 보통 다음 상황에 더 잘 맞습니다.

- 외부 시스템 삽입
- 레거시 임시 통합
- 매우 강한 격리가 필요한 경우

### 5. Build-time Integration

의미:

- 각 micro app을 패키지처럼 상위 앱 빌드에 포함시킵니다

겉으로는 단순해 보이지만, 대개 아래 문제가 생깁니다.

- lockstep release
- 독립 배포 약화
- 상위 빌드에 대한 강한 결합

즉:

**독립 배포가 핵심 가치라면 build-time 통합은 대개 주의해서 써야 합니다.**

## Module Federation과 Import Maps는 무엇이 다른가

중요한 구분:

**Module Federation과 Import Maps는 "어디를 기준으로 앱을 나눌지"를 정하는 개념이 아니라, 나뉜 앱/모듈을 "어떻게 로딩하고 공유할지"를 정하는 기술 선택** 입니다.

### Module Federation

의미:

- 독립 빌드가 런타임에 다른 빌드의 모듈을 expose/consume 할 수 있게 해줍니다

일반적인 형태:

- host가 remote의 `remoteEntry` 를 읽습니다
- 필요한 컴포넌트/모듈을 가져옵니다

자주 공유하는 라이브러리:

- `react`
- `react-dom`
- `react-router-dom`

이런 라이브러리는 singleton 설정이 자주 사용됩니다.

주의점:

- singleton은 버전 호환 정책이 중요합니다
- 여러 remote를 함께 쓴다면 `output.uniqueName` 충돌도 주의해야 합니다

### Import Maps

의미:

- 브라우저가 module specifier를 어떤 URL로 해석할지 제어합니다

예:

- `import React from "react"` 를 특정 URL로 매핑
- shared dependency를 브라우저 레벨에서 한 번만 로드

single-spa 추천 구성을 따르는 경우, import maps 기반 접근이 매우 잘 맞습니다.

### 처음 시작할 때 무엇을 추천하나

#### Module Federation이 더 자연스러운 경우

- webpack 5 중심
- remote component import 개념이 익숙함
- host/remote 모델이 팀에 잘 맞음

#### Import Maps가 더 자연스러운 경우

- root-config 중심 orchestration을 하고 싶음
- shared dependency를 URL 기반으로 관리하고 싶음
- single-spa ecosystem의 권장 방식과 가까운 형태를 원함

### 가장 중요한 운영 원칙

둘 중 어느 쪽을 택하든 더 중요한 것은:

**shared dependency 정책을 하나로 고정하는 것** 입니다.

예:

- React 일부는 import maps로
- 일부는 federation으로

이런 혼합은 가능하더라도 운영 난이도를 급격히 올릴 수 있습니다.

## 같은 도메인으로 갈지, 다른 도메인으로 갈지

이건 기술 선택 이전에 **origin 전략** 입니다.

브라우저에서 same-origin은:

- protocol
- host
- port

가 모두 같아야 성립합니다.

즉:

- `https://app.example.com:443`
- `https://app.example.com:443`

는 same-origin 이지만,

- `https://catalog.example.com`
- `https://checkout.example.com`

는 host가 달라서 same-origin이 아닙니다.

## 같은 origin으로 시작하는 것이 좋은 이유

처음에는 가능하면 같은 origin으로 시작하는 것이 단순합니다.

예:

- `app.example.com/products`
- `app.example.com/checkout`

장점:

- 인증/세션 관리가 단순합니다
- storage 전략이 단순합니다
- BroadcastChannel 같은 수단도 쓰기 쉽습니다
- CORS 이슈가 줄어듭니다

## 다른 origin으로 갈수록 생기는 것

- 격리는 강해집니다
- 공유는 어려워집니다

즉:

- 강한 격리
- 쉬운 공유

는 동시에 최대화하기 어렵습니다.

cross-origin이면 보통 `postMessage()` 같은 명시적 통신 수단이 중요해집니다.

## 한 문장 정리

**Module Federation과 Import Maps는 "분해 기준"이 아니라 "로딩/공유 방식"이고, origin 전략은 그 위에서 브라우저 제약을 결정하는 상위 설계입니다.**
