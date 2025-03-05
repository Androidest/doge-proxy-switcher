//  contents that will be injected into the tab page
'use strict';
import {apiRequest, registerApi, mainIconUrl, storage, toConfig} from './utils.js';

// ============================ Init ====================================
// registerApi({
// });

// select last proxy on page load
apiRequest("bg_setSelectedProxy");