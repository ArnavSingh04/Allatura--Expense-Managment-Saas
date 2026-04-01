import { ExampleService } from '@/services/exampleService';
import { toResponse } from '@/utils/routing-utils';


export async function POST(request: Request) {
  console.log('backend request: /dashboard')

  const data = await request.json();
  const exampleService = new ExampleService();
  const activity = await exampleService.getActivity();

  return toResponse({data: activity});
}
