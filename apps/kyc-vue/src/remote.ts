import { defineCustomElement } from 'vue';
import KycRemoteElement from './KycRemote.ce.vue';

const elementName = 'mfe-kyc-app';

if (!customElements.get(elementName)) {
  customElements.define(elementName, defineCustomElement(KycRemoteElement));
}
