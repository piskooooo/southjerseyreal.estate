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
  `${compliance.agentLicensedName} is licensed to provide real-estate brokerage services in New Jersey. ` +
  "References to Pennsylvania, Delaware, or New York are provided for general regional comparison and " +
  "do not represent an offer of brokerage services outside New Jersey.";
