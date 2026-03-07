/**
 * TestimonialsCarousel Component Tests
 *
 * Tests for the TestimonialsCarousel component including:
 * - Rendering testimonials
 * - Navigation (dots, arrows)
 * - Autoplay functionality
 * - Accessibility
 */

import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { TestimonialsCarousel, type TestimonialsCarouselProps } from '../TestimonialsCarousel';
import type { Testimonial } from '../types';

/**
 * Create mock testimonials
 */
function createMockTestimonials(count = 3): Testimonial[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `testimonial-${i + 1}`,
    quote: `This is testimonial ${i + 1}. It was a great experience working with them.`,
    author: `Author ${i + 1}`,
    role: `Role ${i + 1}`,
    rating: 5,
    image: `/images/author-${i + 1}.jpg`,
  }));
}

/**
 * Render TestimonialsCarousel with default props
 */
function renderCarousel(props: Partial<TestimonialsCarouselProps> = {}) {
  const defaultProps: TestimonialsCarouselProps = {
    testimonials: createMockTestimonials(),
    ...props,
  };

  return render(<TestimonialsCarousel {...defaultProps} />);
}

describe('TestimonialsCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render testimonials', () => {
      renderCarousel();

      expect(screen.getByText(/this is testimonial 1/i)).toBeInTheDocument();
    });

    it('should render all testimonials in the DOM', () => {
      const testimonials = createMockTestimonials(3);
      renderCarousel({ testimonials });

      testimonials.forEach(t => {
        expect(screen.getByText(new RegExp(t.quote))).toBeInTheDocument();
      });
    });

    it('should render title when provided', () => {
      renderCarousel({ title: 'What Our Clients Say' });

      expect(screen.getByRole('heading', { name: /what our clients say/i })).toBeInTheDocument();
    });

    it('should not render title when not provided', () => {
      renderCarousel();

      expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });

    it('should render nothing when testimonials array is empty', () => {
      const { container } = renderCarousel({ testimonials: [] });

      expect(container.firstChild).toBeNull();
    });

    it('should apply custom className', () => {
      const { container } = renderCarousel({ className: 'custom-carousel' });

      expect(container.querySelector('.custom-carousel')).toBeInTheDocument();
    });
  });

  describe('Navigation Dots', () => {
    it('should render navigation dots by default', () => {
      renderCarousel();

      const dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots).toHaveLength(3);
    });

    it('should not render dots when showDots is false', () => {
      renderCarousel({ showDots: false });

      const dots = screen.queryAllByRole('button', { name: /aller au témoignage/i });
      expect(dots).toHaveLength(0);
    });

    it('should not render dots for single testimonial', () => {
      renderCarousel({ testimonials: createMockTestimonials(1) });

      const dots = screen.queryAllByRole('button', { name: /aller au témoignage/i });
      expect(dots).toHaveLength(0);
    });

    it('should navigate to specific slide when dot is clicked', () => {
      renderCarousel({ autoplayInterval: 0 }); // Disable autoplay

      const dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots.length).toBeGreaterThan(2);

      // Click on third dot (index 2)
      const thirdDot = dots[2]!;
      act(() => {
        fireEvent.click(thirdDot);
      });

      // The third dot should now be active (wider)
      expect(thirdDot).toHaveAttribute('aria-current', 'true');
    });

    it('should show current slide indicator', () => {
      renderCarousel();

      const dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      // First dot should be current
      expect(dots[0]).toHaveAttribute('aria-current', 'true');
    });
  });

  describe('Navigation Arrows', () => {
    it('should not render arrows by default', () => {
      renderCarousel();

      expect(screen.queryByRole('button', { name: /précédent/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /suivant/i })).not.toBeInTheDocument();
    });

    it('should render arrows when showArrows is true', () => {
      renderCarousel({ showArrows: true });

      expect(screen.getByRole('button', { name: /précédent/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /suivant/i })).toBeInTheDocument();
    });

    it('should not render arrows for single testimonial', () => {
      renderCarousel({
        testimonials: createMockTestimonials(1),
        showArrows: true,
      });

      expect(screen.queryByRole('button', { name: /précédent/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /suivant/i })).not.toBeInTheDocument();
    });

    it('should go to next slide when next arrow is clicked', () => {
      renderCarousel({ showArrows: true, autoplayInterval: 0 });

      const nextButton = screen.getByRole('button', { name: /suivant/i });
      act(() => {
        fireEvent.click(nextButton);
      });

      const dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[1]).toHaveAttribute('aria-current', 'true');
    });

    it('should go to previous slide when previous arrow is clicked', () => {
      renderCarousel({ showArrows: true, autoplayInterval: 0 });

      const prevButton = screen.getByRole('button', { name: /précédent/i });
      act(() => {
        fireEvent.click(prevButton);
      });

      // Should wrap to last slide
      const dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[2]).toHaveAttribute('aria-current', 'true');
    });

    it('should wrap around from last to first slide', () => {
      renderCarousel({ showArrows: true, autoplayInterval: 0 });

      const nextButton = screen.getByRole('button', { name: /suivant/i });

      // Each click must be in its own act() so React commits the state
      // between clicks (handleNext depends on currentIndex via closure)
      act(() => {
        fireEvent.click(nextButton);
      }); // Go to slide 2
      act(() => {
        fireEvent.click(nextButton);
      }); // Go to slide 3
      act(() => {
        fireEvent.click(nextButton);
      }); // Go back to slide 1 (wrap)

      const dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[0]).toHaveAttribute('aria-current', 'true');
    });

    it('should wrap around from first to last slide', () => {
      renderCarousel({ showArrows: true, autoplayInterval: 0 });

      const prevButton = screen.getByRole('button', { name: /précédent/i });
      act(() => {
        fireEvent.click(prevButton);
      });

      const dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[2]).toHaveAttribute('aria-current', 'true');
    });
  });

  describe('Autoplay', () => {
    it('should auto-advance slides at configured interval', () => {
      renderCarousel({ autoplayInterval: 5000 });

      // Initial state - first slide
      let dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[0]).toHaveAttribute('aria-current', 'true');

      // Advance time by 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should now be on second slide
      dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[1]).toHaveAttribute('aria-current', 'true');
    });

    it('should loop back to first slide after last', () => {
      renderCarousel({ autoplayInterval: 1000 });

      // Advance through all slides
      act(() => {
        vi.advanceTimersByTime(3000); // 3 slides
      });

      // Should be back to first slide
      const dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[0]).toHaveAttribute('aria-current', 'true');
    });

    it('should not autoplay when interval is 0', () => {
      renderCarousel({ autoplayInterval: 0 });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Should still be on first slide
      const dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[0]).toHaveAttribute('aria-current', 'true');
    });

    it('should not autoplay for single testimonial', () => {
      renderCarousel({
        testimonials: createMockTestimonials(1),
        autoplayInterval: 1000,
      });

      // No error should occur and component should render
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText(/this is testimonial 1/i)).toBeInTheDocument();
    });

    it('should use default autoplay interval of 5000ms', () => {
      renderCarousel(); // Default autoplayInterval

      // First slide initially
      let dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[0]).toHaveAttribute('aria-current', 'true');

      // Advance 4999ms - should still be on first slide
      act(() => {
        vi.advanceTimersByTime(4999);
      });
      dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[0]).toHaveAttribute('aria-current', 'true');

      // Advance 1 more ms (total 5000ms) - should move to second slide
      act(() => {
        vi.advanceTimersByTime(1);
      });
      dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[1]).toHaveAttribute('aria-current', 'true');
    });

    it('should clean up interval on unmount', () => {
      const { unmount } = renderCarousel({ autoplayInterval: 1000 });

      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Testimonial Content', () => {
    it('should display testimonial quote', () => {
      const testimonials = [
        {
          id: '1',
          quote: 'Amazing service, highly recommend!',
          author: 'John Doe',
        },
      ];

      renderCarousel({ testimonials });

      expect(screen.getByText(/Amazing service, highly recommend!/)).toBeInTheDocument();
    });

    it('should display author name', () => {
      const testimonials = [
        {
          id: '1',
          quote: 'Great experience!',
          author: 'Jane Smith',
        },
      ];

      renderCarousel({ testimonials });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should display author role when provided', () => {
      const testimonials = [
        {
          id: '1',
          quote: 'Great experience!',
          author: 'Jane Smith',
          role: 'CEO, Company Inc.',
        },
      ];

      renderCarousel({ testimonials });

      expect(screen.getByText('CEO, Company Inc.')).toBeInTheDocument();
    });
  });

  describe('Motion Component', () => {
    it('should use custom motion component when provided', () => {
      const MotionDiv = vi.fn(({ children, className }) => (
        <div data-testid="motion-wrapper" className={className}>
          {children}
        </div>
      ));

      renderCarousel({ motionComponent: MotionDiv });

      expect(screen.getAllByTestId('motion-wrapper').length).toBeGreaterThan(0);
    });

    it('should render without motion component', () => {
      renderCarousel();

      // Should render successfully without motion
      expect(screen.getByText(/this is testimonial 1/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should reset to first slide when testimonials change', () => {
      const { rerender } = render(
        <TestimonialsCarousel
          testimonials={createMockTestimonials(5)}
          autoplayInterval={0}
          showArrows
        />
      );

      // Navigate to slide 3
      const nextButton = screen.getByRole('button', { name: /suivant/i });
      act(() => {
        nextButton.click();
        nextButton.click();
      });

      // Change testimonials
      rerender(
        <TestimonialsCarousel
          testimonials={createMockTestimonials(3)}
          autoplayInterval={0}
          showArrows
        />
      );

      // Should reset to first slide
      const dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[0]).toHaveAttribute('aria-current', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should render as section element', () => {
      const { container } = renderCarousel();

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should have proper button labels for navigation', () => {
      renderCarousel({ showArrows: true });

      expect(screen.getByRole('button', { name: /témoignage précédent/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /témoignage suivant/i })).toBeInTheDocument();
    });

    it('should have proper labels for dot navigation', () => {
      renderCarousel();

      expect(screen.getByRole('button', { name: 'Aller au témoignage 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Aller au témoignage 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Aller au témoignage 3' })).toBeInTheDocument();
    });

    it('should indicate current slide with aria-current', () => {
      renderCarousel();

      const dots = screen.getAllByRole('button', { name: /aller au témoignage/i });
      expect(dots[0]).toHaveAttribute('aria-current', 'true');
      expect(dots[1]).not.toHaveAttribute('aria-current');
    });
  });

  describe('Card Styling', () => {
    it('should apply custom cardClassName', () => {
      const { container } = renderCarousel({ cardClassName: 'custom-card' });

      expect(container.querySelector('.custom-card')).toBeInTheDocument();
    });
  });
});
