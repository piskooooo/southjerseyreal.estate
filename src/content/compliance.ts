import complianceData from "./complianceData.json";

export const compliance = complianceData;

export const brokerageDisclosureText =
  `${compliance.brokerLegalName}, ${compliance.brokerDescriptor}. ` +
  `Licensed brokerage office: ${compliance.licensedOfficePhone}.`;

export const agentLicenseDisclosureText =
  `${compliance.agentLicensedName}, ${compliance.agentLicenseType}, ` +
  `NJ Real Estate License #${compliance.agentLicenseNumber}.`;

export const operatorDisclosureText =
  `South Jersey Real Estate is a marketing website operated by ${compliance.agentLicensedName}, ` +
  `a ${compliance.agentLicenseType} affiliated with ${compliance.brokerLegalName}, ` +
  `${compliance.brokerDescriptor}. Licensed brokerage office: ${compliance.licensedOfficePhone}.`;

export const outOfStateServiceDisclosure =
  "Nearby states are discussed for general regional comparison. Brokerage services are offered only in " +
  "New Jersey through the licensed professional and brokerage identified in the footer.";
